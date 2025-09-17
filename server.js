const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const centralDbUri = `mongodb+srv://dycattendance:dycattendance@dyc-attendance.r5jyblp.mongodb.net/institutions`;

mongoose.connect(centralDbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to institutions database'))
    .catch((err) => console.error('Central DB connection failed:', err.message));

const InstitutionSchema = new mongoose.Schema({
    dbName: String,
    institutionName: String,
    userId: String,
    password: String,
    Teachers: Array,
});
const Institution = mongoose.model('Institution', InstitutionSchema);

const connectionCache = {};
const getDbConnection = async (dbName) => {
    if (connectionCache[dbName]) return connectionCache[dbName];
    const dbUri = `mongodb+srv://dycattendance:dycattendance@dyc-attendance.r5jyblp.mongodb.net/${dbName}`;
    const conn = await mongoose.createConnection(dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    connectionCache[dbName] = conn;
    return conn;
};
app.get('/', (req, res) => {
    res.send('Hello from Express server!');
});

app.post('/createdb', async (req, res) => {
    const { dbName, userId, password } = req.body;
    if (!dbName || !userId || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const exists = await Institution.findOne({ userId });
        if (exists) return res.status(400).json({ error: 'UserId already exists' });
        const dbExists = await Institution.findOne({ dbName: dbName.replace(/\s+/g, '').toLowerCase() });
        if (dbExists) return res.status(400).json({ error: 'Institution name already exists' });

        const conn = await getDbConnection(dbName.replace(/\s+/g, '').toLowerCase());

        const TeacherSchema = new mongoose.Schema({ name: String, staffId: String, password: String, subject: String });
        // --- Updated StudentSchema for marks storage ---
        const StudentSchema = new mongoose.Schema({
            name: { type: String, required: true },
            class: { type: String, required: true },
            rollNumber: { type: String, required: true },
            present: { type: [String], default: [] },
            halfDay: { type: [String], default: [] },
            absent: { type: [String], default: [] },
            fees: { type: [{ feeName: String, amount: Number }], default: [] },
            paid: { type: [{ feeName: String, amount: Number, date: String }], default: [] },

            // Marks storage per semester
            sem1: { type: [{ subject: String, marks: String }], default: [] },
            sem2: { type: [{ subject: String, marks: String }], default: [] },
            sem3: { type: [{ subject: String, marks: String }], default: [] },
            sem4: { type: [{ subject: String, marks: String }], default: [] },
            sem5: { type: [{ subject: String, marks: String }], default: [] },
            sem6: { type: [{ subject: String, marks: String }], default: [] },
        });

        const Teacher = conn.model('Teacher', TeacherSchema);
        const Student = conn.model('Student', StudentSchema); // Use the updated schema

        await new Teacher({ name: 'John Doe', staffId: 'T001', password: 'pass', subject: 'Math' }).save();
        await new Student({ name: 'Jane Smith', class: '10A', rollNumber: 'S001' }).save();

        await new Institution({ dbName: dbName.replace(/\s+/g, '').toLowerCase(), institutionName: dbName, userId, password }).save();
        res.status(201).json({ message: `Database "${dbName}" created` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create DB', details: err.message });
    }
});

app.post('/staffLogin', async (req, res) => {
    const { institution, username, password } = req.body;
    if (!institution || !username || !password) return res.status(400).json({ error: 'All fields are required' });
    const conn = await getDbConnection(institution);
    const Teacher = conn.models.Teacher || conn.model('Teacher', new mongoose.Schema({ name: String, staffId: String, password: String, subject: String }));
    const teacher = await Teacher.findOne({ staffId: username, password });
    if (!teacher) return res.status(401).json({ error: 'Invalid credentials' });
    const institutionData = await Institution.findOne({ dbName: institution });
    if (!institutionData) return res.status(404).json({ error: 'Institution not found' });
    res.json({ message: 'Login successful', dbName: institution, adminUserId: institutionData.userId, adminPassword: institutionData.password });
});

app.post('/adminLogin', async (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password) return res.status(400).json({ error: 'All fields are required' });
    const institution = await Institution.findOne({ userId, password });
    if (!institution) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful', dbName: institution.dbName });
});

app.post('/studentLogin', async (req, res) => {
    const { institution, rollNumber } = req.body;
    if (!institution || !rollNumber) return res.status(400).json({ error: 'All fields are required' });
    const conn = await getDbConnection(institution);
    // --- Use the updated Student Schema here as well ---
    const Student = conn.models.Student || conn.model('Student', new mongoose.Schema({
        name: { type: String, required: true },
        class: { type: String, required: true },
        rollNumber: { type: String, required: true },
        present: { type: [String], default: [] },
        halfDay: { type: [String], default: [] },
        absent: { type: [String], default: [] },
        fees: { type: [{ feeName: String, amount: Number }], default: [] },
        paid: { type: [{ feeName: String, amount: Number, date: String }], default: [] },
        sem1: { type: [{ subject: String, marks: String }], default: [] },
        sem2: { type: [{ subject: String, marks: String }], default: [] },
        sem3: { type: [{ subject: String, marks: String }], default: [] },
        sem4: { type: [{ subject: String, marks: String }], default: [] },
        sem5: { type: [{ subject: String, marks: String }], default: [] },
        sem6: { type: [{ subject: String, marks: String }], default: [] },
    }));
    const student = await Student.findOne({ rollNumber });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    res.json({ message: 'Login successful', studentData: student });
});

app.get('/institutions', async (req, res) => {
    try {
        const institutions = await Institution.find({});
        res.json(institutions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch institutions', details: err.message });
    }
});

const dbMiddleware = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const password = req.headers['x-user-password'];
    if (!userId || !password) return res.status(400).json({ error: 'Missing admin credentials in headers' });
    const institution = await Institution.findOne({ userId, password });
    if (!institution) return res.status(401).json({ error: 'Invalid credentials' });
    try {
        const conn = await getDbConnection(institution.dbName);
        req.db = conn;
        req.institution = institution.institutionName;
        req.dbName = institution.dbName;
        next();
    } catch (err) {
        res.status(500).json({ error: 'DB connection failed', details: err.message });
    }
};

app.use(dbMiddleware);

const getModels = (conn) => {
    // --- Updated StudentSchema for marks storage ---
    const studentSchema = new mongoose.Schema({
        name: { type: String, required: true },
        class: { type: String, required: true },
        rollNumber: { type: String, required: true },

        present: { type: [String], default: [] },
        halfDay: { type: [String], default: [] },
        absent: { type: [String], default: [] },
        fees: { type: [{ feeName: String, amount: Number }], default: [] },
        paid: { type: [{ feeName: String, amount: Number, date: String }], default: [] },

        sem1: { type: [{ subject: String, marks: String }], default: [] },
        sem2: { type: [{ subject: String, marks: String }], default: [] },
        sem3: { type: [{ subject: String, marks: String }], default: [] },
        sem4: { type: [{ subject: String, marks: String }], default: [] },
        sem5: { type: [{ subject: String, marks: String }], default: [] },
        sem6: { type: [{ subject: String, marks: String }], default: [] },
    });

    const Student = conn.models.Student || conn.model("Student", studentSchema);

    const Teacher = conn.models.Teacher || conn.model('Teacher', new mongoose.Schema({ name: String, staffId: String, password: String, subject: String }));
    const Class = conn.models.Class || conn.model('Class', new mongoose.Schema({ className: String, Students: [{ rollNumber: String, name: String }] }));
    const Attendance = conn.models.Attendance || conn.model('Attendance', new mongoose.Schema({
        className: String,
        date: { type: Date, default: Date.now },
        records: [
            {
                studentId: mongoose.Schema.Types.ObjectId,
                name: String,
                rollNumber: String,
                attendance: [Boolean]
            }
        ],
        present: [{ type: String }],
        halfDay: [{ type: String }],
        absent: [{ type: String }],
        staffId: String,
        timeModified: String,
    }));
    return { Student, Teacher, Class, Attendance };
};

app.get('/currentDb', async (req, res) => {
    try {
        const { Student, Teacher } = getModels(req.db);
        const students = await Student.find({});
        const teachers = await Teacher.find({});
        console.log(`Current DB: ${req.institution} (${req.dbName})`);
        res.json({ dbName: req.institution, students, staff: teachers });
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed', details: err.message });
    }
});

app.post('/addStudent', async (req, res) => {
    const { name, class: studentClass, rollNumber } = req.body;
    const { Student, Class } = getModels(req.db);
    if (!name || !studentClass || !rollNumber) return res.status(400).json({ error: 'All fields required' });
    const exists = await Student.findOne({ rollNumber });
    if (exists) return res.status(400).json({ error: 'Roll number exists' });
    const classExists = await Class.findOne({ className: studentClass });
    if (!classExists) return res.status(400).json({ error: 'Class does not exist' });
    classExists.Students.push({ rollNumber, name });
    await classExists.save();
    // --- When adding a new student, ensure the marks fields are initialized as empty arrays of objects ---
    await new Student({ name, class: studentClass, rollNumber, sem1: [], sem2: [], sem3: [], sem4: [], sem5: [], sem6: [] }).save();
    res.status(201).json({ message: 'Student added' });
});

app.post('/deleteStudent', async (req, res) => {
    const { studentId, rollNumber, className } = req.body;
    const { Student } = getModels(req.db);
    const result = await Student.deleteOne({ rollNumber });

    if (result.deletedCount === 0) return res.status(404).json({ error: 'Student not found' });
    const { Class } = getModels(req.db);
    const classExists = await Class.findOne({ className });

    if (!classExists) return res.status(400).json({ error: 'Class does not exist' });
    classExists.Students = classExists.Students.filter(student => student.rollNumber !== rollNumber);
    await classExists.save();


    res.json({ message: 'Student deleted' });
});

app.post('/addStaff', async (req, res) => {
    const { name, staffId, password, subject } = req.body;
    const { Teacher } = getModels(req.db);
    const exists = await Teacher.findOne({ staffId });
    if (exists) return res.status(400).json({ error: 'Staff Id already exists' });
    await mongoose.model('Institution').updateOne(
        { dbName: req.dbName },
        { $push: { Teachers: { name, staffId, password, subject } } }
    );
    await new Teacher({ name, staffId, password, subject }).save();
    res.status(201).json({ message: 'Staff added' });
});

app.post('/deleteStaff', async (req, res) => {
    const { staffId } = req.body;
    const { Teacher } = getModels(req.db);
    const result = await Teacher.deleteOne({ staffId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff deleted' });
});

app.post('/addClass', async (req, res) => {
    const { className } = req.body;
    const { Class } = getModels(req.db);
    const exists = await Class.find({});
    for (const cls of exists) {
        if ((cls.className.toLowerCase()).replace(' ', '') === (className.toLowerCase()).replace(' ', '')) {
            return res.status(400).json({ error: 'Class exists' });
        }
    }
    await new Class({ className }).save();
    res.status(201).json({ message: 'Class added' });
});

app.get('/classes', async (req, res) => {
    const { Class } = getModels(req.db);
    const classes = await Class.find({});
    res.json(classes);
});

app.delete('/deleteClass/:classId', async (req, res) => {
    const { classId } = req.params;
    const className = req.body.className;
    if (!classId || !className) return res.status(400).json({ error: 'Class ID and name required' });
    const { Class, Student } = getModels(req.db);
    const result = await Class.deleteOne({ _id: classId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Class not found' });
    await Student.deleteMany({ class: className });
    res.json({ message: 'Class deleted' });
});


app.get('/getAttendance/:className/:date', async (req, res) => {
    const { className, date } = req.params;

    if (!className || !date) {
        return res.status(400).json({ error: 'Class name and date are required' });
    }

    try {
        const { Attendance } = getModels(req.db);

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const record = await Attendance.findOne({
            className,
            date: { $gte: start, $lte: end }
        });

        if (!record) return res.status(200).json(null); // No record for date

        res.status(200).json({
            records: record.records,
            staffId: record.staffId,
            timeModified: record.timeModified
        });

    } catch (error) {
        console.error('Error fetching attendance by date:', error);
        res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
    }
});

app.post('/submitAttendance', async (req, res) => {
    const { className, attendanceRecords, date, staffId } = req.body;

    if (!className || !Array.isArray(attendanceRecords)) {
        return res.status(400).json({
            error: 'Both className and attendanceRecords array are required'
        });
    }

    try {
        const { Attendance } = getModels(req.db);

        // Normalize selected date to midnight
        const selectedDate = new Date(date || new Date());
        selectedDate.setHours(0, 0, 0, 0);

        // Safe IST time generation using Intl API
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(now);
        const partMap = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

        const yyyy = partMap.year;
        const mm = partMap.month;
        const dd = partMap.day;
        const day = partMap.weekday;
        const hh = partMap.hour;
        const min = partMap.minute;

        const timeModified = `${dd}-${mm}-${yyyy} (${day}) ${hh}:${min}`;

        // Check if attendance already exists
        let existingRecord = await Attendance.findOne({
            className,
            date: selectedDate
        });

        if (existingRecord) {
            existingRecord.records = attendanceRecords;
            existingRecord.staffId = staffId || null;
            existingRecord.timeModified = timeModified;
            await existingRecord.save();

            return res.status(200).json({
                message: 'Attendance updated successfully for selected date'
            });
        }

        // Create new attendance record
        const newAttendance = new Attendance({
            className,
            records: attendanceRecords,
            date: selectedDate,
            staffId: staffId || null,
            timeModified: timeModified
        });

        await newAttendance.save();

        return res.status(201).json({
            message: 'Attendance submitted successfully for selected date'
        });
    } catch (error) {
        console.error('Error submitting attendance:', error);
        return res.status(500).json({
            error: 'Failed to submit attendance',
            details: error.message
        });
    }
});


// Optional: You can modularize this into middleware if needed


app.post('/finishAttendance', async (req, res) => {
    const { className, date } = req.body;

    // 🔐 Validate inputs
    if (!className || !date) {
        return res.status(400).json({ error: 'Class name and date are required' });
    }

    // 🔐 Check admin credentials in headers
    const userId = req.headers['x-user-id'];
    const password = req.headers['x-user-password'];

    if (!userId || !password) {
        return res.status(401).json({ error: 'Missing admin credentials in headers' });
    }

    try {
        const { Attendance } = getModels(req.db);
        const { Student } = getModels(req.db);
        // 🕓 Normalize date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // 🔍 Find attendance record
        const record = await Attendance.findOne({
            className,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!record) {
            return res.status(404).json({ error: 'No attendance record found for this class on the specified date' });
        }

        // ✅ Classify students
        const present = [];
        const halfDay = [];
        const absent = [];

        for (const student of record.records) {
            const totalPeriods = student.attendance.length;
            const presentCount = student.attendance.filter(val => val).length;
            const studentDoc = await Student.findOne({ rollNumber: student.rollNumber });
            console.log(`Processing student: ${studentDoc.name} (${student.rollNumber})`);
            studentDoc.present = studentDoc.present.filter(dates => dates !== date);
            studentDoc.halfDay = studentDoc.halfDay.filter(dates => dates !== date);
            studentDoc.absent = studentDoc.absent.filter(dates => dates !== date);
            studentDoc.save
            if (presentCount === 0) {
                absent.push(student.rollNumber);
                studentDoc.absent.push(date);
            } else if (presentCount === 2) {
                present.push(student.rollNumber);
                studentDoc.present.push(date);
            } else {
                halfDay.push(student.rollNumber);
                studentDoc.halfDay.push(date);
            }
            studentDoc.save().catch(err => console.error(`Failed to update student ${student.rollNumber}:`, err));
        }

        // 📝 Update the record
        record.present = present;
        record.halfDay = halfDay;
        record.absent = absent;
        record.finalized = true;

        await record.save();

        return res.status(200).json({
            message: 'Attendance finalized successfully',
            finalized: true,
            summary: {
                presentCount: present.length,
                halfDayCount: halfDay.length,
                absentCount: absent.length,
                present,
                halfDay,
                absent
            }
        });

    } catch (error) {
        console.error('Error finishing attendance:', error);
        return res.status(500).json({
            error: 'Failed to finish attendance',
            details: error.message
        });
    }
});


app.get('/attendanceReport/:className', async (req, res) => {
    const { className } = req.params;
    const { Student } = getModels(req.db);
    const userId = req.headers['x-user-id'];
    const password = req.headers['x-user-password'];

    // ✅ Validate credentials
    if (!userId || !password) {
        return res.status(401).json({ error: 'Missing admin credentials in headers' });
    }

    if (!className) {
        return res.status(400).json({ error: 'Class name is required' });
    }

    try {
        // ✅ Query students by class
        const students = await Student.find({ class: className }); // or className if your field is named that

        if (!students.length) {
            return res.status(404).json({ error: 'No attendance records found for this class' });
        }

        res.json(students);
    } catch (error) {
        console.error('Error fetching attendance report:', error);
        res.status(500).json({ error: 'Failed to fetch attendance report', details: error.message });
    }
});

// New routes for student marks management
app.get('/student/:rollNumber/marks/:semester', async (req, res) => {
    const { rollNumber, semester } = req.params;

    if (!rollNumber || !semester) {
        return res.status(400).json({ error: 'Roll number and semester are required' });
    }

    // The dbMiddleware handles admin credentials for req.db
    try {
        const { Student } = getModels(req.db);
        const student = await Student.findOne({ rollNumber });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Dynamically access the semester field (e.g., student['sem1'])
        const marks = student[semester] || [];

        res.json({ rollNumber, semester, marks });
    } catch (error) {
        console.error(`Error fetching marks for ${rollNumber} in ${semester}:`, error);
        res.status(500).json({ error: 'Failed to fetch marks', details: error.message });
    }
});

app.put('/student/:rollNumber/marks/:semester', async (req, res) => {
    const { rollNumber, semester } = req.params;
    const { subjects } = req.body; // subjects will be an array of { subject: String, marks: String }

    if (!rollNumber || !semester || !Array.isArray(subjects)) {
        return res.status(400).json({ error: 'Roll number, semester, and subjects array are required' });
    }

    // The dbMiddleware handles admin credentials for req.db
    try {
        const { Student } = getModels(req.db);
        const student = await Student.findOne({ rollNumber });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Update the specific semester's marks
        student[semester] = subjects; // Assign the new array of subjects/marks

        await student.save();

        res.status(200).json({ message: `Marks for ${rollNumber} in ${semester} updated successfully` });
    } catch (error) {
        console.error(`Error updating marks for ${rollNumber} in ${semester}:`, error);
        res.status(500).json({ error: 'Failed to update marks', details: error.message });
    }
});

// Add this route to your server.js, perhaps before app.listen()
app.put('/student/:studentId', async (req, res) => {
    const { studentId } = req.params;
    const updateFields = req.body; // Expects an object like { sem1: ["Math:90", "Science:85"] }

    // Validate admin credentials (already handled by dbMiddleware but good to be explicit)
    const userId = req.headers['x-user-id'];
    const password = req.headers['x-user-password'];
    if (!userId || !password) return res.status(400).json({ error: 'Missing admin credentials in headers' });
    // dbMiddleware would have already checked validity, so just proceed

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No fields provided for update.' });
    }

    try {
        const { Student } = getModels(req.db); // Get Student model for the current institution DB
        const result = await Student.findByIdAndUpdate(
            studentId,
            { $set: updateFields }, // Use $set to update specific fields
            { new: true, runValidators: true } // new: true returns the updated document
        );

        if (!result) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        res.status(200).json({ message: 'Student data updated successfully.', student: result });
    } catch (error) {
        console.error(`Error updating student ${studentId}:`, error);
        res.status(500).json({ error: 'Failed to update student data', details: error.message });
    }
});
// ... (previous code) ...

// New route: To SET/UPDATE the FEES DUE for students
app.post('/setStudentFees', async (req, res) => {
    // Expects: { className: "10A", students: [{ rollNumber: "S001", fees: [{ feeName: "Tuition", amount: 1000 }] }, ...] }
    const { className, students: studentsWithFees } = req.body; // Renamed to clarify

    if (!className || !Array.isArray(studentsWithFees)) {
        return res.status(400).json({ error: 'Class name and an array of students with their fees are required' });
    }

    try {
        const { Student } = getModels(req.db);
        const updatedStudents = [];

        for (const studentData of studentsWithFees) {
            const { rollNumber, fees: newFeesDue } = studentData; // fees: [{ feeName, amount }]

            if (!rollNumber || !Array.isArray(newFeesDue)) {
                console.warn(`Skipping invalid student data: ${JSON.stringify(studentData)}`);
                continue;
            }

            const student = await Student.findOne({ rollNumber });

            if (!student) {
                console.warn(`Student with roll number ${rollNumber} not found, skipping fee update.`);
                continue;
            }

            // Update the 'fees' array in the student document
            student.fees = newFeesDue.filter(f => f.feeName && f.amount !== undefined && f.amount !== null);

            // Recalculate feesPending based on total fees due and feesPaid
            const totalFeesDue = student.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
            student.feesPending = Math.max(0, totalFeesDue - student.feesPaid);

            await student.save();
            updatedStudents.push(student);
        }

        res.status(200).json({ message: 'Student fees set successfully', updatedStudents });
    } catch (error) {
        console.error('Error setting student fees:', error);
        res.status(500).json({ error: 'Failed to set student fees', details: error.message });
    }
});

// Original fees route - This needs to be for RECORDING PAYMENTS
// I've commented out the original and provided a more appropriate version
/*
app.post('/fees', async (req, res) => {
    const { className, fees } = req.body; // fees is an array of { rollNumber, fees: [{ feeName, amount }] }

    if (!className || !Array.isArray(fees)) {
        return res.status(400).json({ error: 'Class name and fees array are required' });

    }
    try {
        const { Student } = getModels(req.db);
        for (const studentFee of fees) {
            const { rollNumber, fees: feeDetails } = studentFee;
            if (!rollNumber || !Array.isArray(feeDetails)) continue;
            const student = await Student.findOne({ rollNumber });
            if (!student) {
                console.warn(`Student with roll number ${rollNumber} not found, skipping fee update.`);
                continue;
            }
            let totalPaid = 0;
            for (const fee of feeDetails) {
                const amount = parseFloat(fee.amount) || 0;
                totalPaid += amount;
            }
            student.feesPaid += totalPaid;
            student.feesPending = Math.max(0, student.feesPending - totalPaid);
            await student.save();
        }
        res.status(200).json({ message: 'Fees updated successfully' });
    } catch (error) {
        console.error('Error updating fees:', error);
        res.status(500).json({ error: 'Failed to update fees', details: error.message });
    }
});
*/

// **New /recordPayment route - for actually recording payments**
app.post('/recordPayment', async (req, res) => {
    const { rollNumber, paymentDetails } = req.body; // paymentDetails: [{ feeName: "Tuition", amount: 500, date: "2023-10-26" }]

    if (!rollNumber || !Array.isArray(paymentDetails) || paymentDetails.length === 0) {
        return res.status(400).json({ error: 'Roll number and payment details are required' });
    }

    try {
        const { Student } = getModels(req.db);
        const student = await Student.findOne({ rollNumber });

        if (!student) {
            return res.status(404).json({ error: `Student with roll number ${rollNumber} not found.` });
        }

        let totalPaymentAmount = 0;
        const now = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD

        for (const payment of paymentDetails) {
            const { feeName, amount } = payment;
            if (!feeName || typeof amount !== 'number' || amount <= 0) {
                console.warn(`Skipping invalid payment detail: ${JSON.stringify(payment)} for ${rollNumber}`);
                continue;
            }

            // Add to the 'paid' array
            student.paid.push({ feeName, amount, date: payment.date || now });
            totalPaymentAmount += amount;
        }

        // Update feesPaid and feesPending
        student.feesPaid += totalPaymentAmount;
        // Recalculate feesPending based on total fees due and updated feesPaid
        const totalFeesDue = student.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
        student.feesPending = Math.max(0, totalFeesDue - student.feesPaid);

        await student.save();

        res.status(200).json({ message: `Payment recorded successfully for ${rollNumber}`, student });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ error: 'Failed to record payment', details: error.message });
    }
});

// ... (rest of the code) ...
// app.get('/allStudentsFees', async (req, res) => {
//     try {
//         const { Student } = getModels(req.db);
//         const students = await Student.find({}, {
//             name: 1,
//             rollNumber: 1,
//             class: 1,
//             fees: 1,
//             paid: 1,
//             feesPaid: 1,
//             feesPending: 1
//         });

//         if (!students.length) {
//             return res.status(404).json({ message: 'No students found' });
//         }

//         const formattedStudents = students.map(student => ({
//             name: student.name,
//             _id: student._id,
//             rollNumber: student.rollNumber,
//             class: student.class,
//             feeDetails: {
//                 dueAmount: student.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0),
//                 paidAmount: student.paid.reduce((sum, payment) => sum + (payment.amount || 0), 0),
//                 payments: student.paid,
//                 pending: student.fees.map(fee => ({
//                     feeName: fee.feeName,
//                     amount: fee.amount,
//                     paidAmount: student.paid
//                         .filter(p => p.feeName === fee.feeName)
//                         .reduce((sum, p) => sum + (p.amount || 0), 0)
//                 }))
//             }
//         }));

//         res.json(formattedStudents);
//     } catch (error) {
//         console.error('Error fetching students fees:', error);
//         res.status(500).json({ error: 'Failed to fetch students fees', details: error.message });
//     }
// });

    // In server.js, modify the app.get('/allStudentsFees') route

    app.get('/allStudentsFees', async (req, res) => {
        try {
            const { Student } = getModels(req.db);
            const students = await Student.find({}, {
                name: 1,
                rollNumber: 1,
                class: 1,
                fees: 1, // Get all originally set fees
                paid: 1, // Get all recorded payments
            });

            if (!students.length) {
                return res.status(404).json({ message: 'No students found' });
            }

            const formattedStudents = students.map(student => {
                const totalFeesDue = student.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
                const totalFeesPaid = student.paid.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                const totalPendingAmount = Math.max(0, totalFeesDue - totalFeesPaid);

                // This structure will allow us to easily show status in the frontend
                const feeDetailsWithStatus = student.fees.map(originalFee => {
                    const paymentsForThisFee = student.paid.filter(p => p.feeName === originalFee.feeName);
                    const amountPaidForThisFee = paymentsForThisFee.reduce((sum, p) => sum + (p.amount || 0), 0);
                    const remainingAmount = originalFee.amount - amountPaidForThisFee;

                    return {
                        _id: originalFee._id, // Keep the original _id if available, or generate one
                        feeName: originalFee.feeName,
                        originalAmount: originalFee.amount,
                        amountPaid: amountPaidForThisFee,
                        pendingAmount: Math.max(0, remainingAmount),
                        status: remainingAmount <= 0 ? 'Paid' : (amountPaidForThisFee > 0 ? 'Partially Paid' : 'Pending')
                    };
                });


                return {
                    _id: student._id, // Add student _id here for easy access in frontend
                    name: student.name,
                    rollNumber: student.rollNumber,
                    class: student.class,
                    feeDetails: {
                        totalDue: totalFeesDue,
                        totalPaid: totalFeesPaid,
                        totalPending: totalPendingAmount,
                        // Combine original fees with their payment status
                        allFees: feeDetailsWithStatus,
                        payments: student.paid, // Keep original payments array for detailed history if needed
                    }
                };
            });

            res.json(formattedStudents);
        } catch (error) {
            console.error('Error fetching students fees:', error);
            res.status(500).json({ error: 'Failed to fetch students fees', details: error.message });
        }
    });

// New route for updating student fees (recording payments)
app.put('/updateStudentFees/:studentId', async (req, res) => {
    const { studentId } = req.params;
    const { paymentsToAdd, totalPaymentMade } = req.body; // paymentsToAdd is an array of { feeName, amount, date }

    if (!Array.isArray(paymentsToAdd) || paymentsToAdd.length === 0) {
        return res.status(400).json({ error: 'paymentsToAdd array is required and should not be empty.' });
    }

    try {
        const { Student } = getModels(req.db);
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        // Add each new payment to the 'paid' array
        paymentsToAdd.forEach(payment => {
            student.paid.push({
                feeName: payment.feeName,
                amount: payment.amount,
                date: payment.date // Use provided date or default
            });
        });

        // Recalculate feesPaid based on the updated 'paid' array
        student.feesPaid = student.paid.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Recalculate feesPending based on total fees due and updated feesPaid
        const totalFeesDue = student.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
        student.feesPending = Math.max(0, totalFeesDue - student.feesPaid);

        await student.save();

        res.status(200).json({ message: 'Fees updated successfully!', student });
    } catch (error) {
        console.error(`Error updating fees for student ${studentId}:`, error);
        res.status(500).json({ error: 'Failed to update fees', details: error.message });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));