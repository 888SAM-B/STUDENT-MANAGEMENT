
import React, { useEffect, useState } from 'react';
const url=import.meta.env.VITE_URL
import './AddStudents.css';

const AddStudents = () => {
  const [dbName, setDbName] = useState('');
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); 
  const [loading, setLoading] = useState(true); // for initial loader
  const [error, setError] = useState('');
  const [display, setDisplay] = useState('none');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
  document.body.style.background = 'linear-gradient(to right, #083f66, #0e204d)';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = '"Roboto Condensed", sans-serif';

  return () => {
    document.body.style.background = '';
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.fontFamily = '';
  };
}, []);


  useEffect(() => {
    const fetchDbInfo = async () => {
      try {
        const response = await fetch(`${url}/currentDb`, {
          headers: {
            'x-user-id': sessionStorage.getItem('adminUserId'),
            'x-user-password': sessionStorage.getItem('adminPassword')
          }
        } );
        const data = await response.json();

        if (data.dbName && data.dbName !== 'No active database connection') {
          setDbName(data.dbName);
          setStudents(data.students || []);
          setAllStudents(data.students || []); // Store all students for filtering
          setLoading(false);
        } else {
          // Retry after short delay if DB is not yet connected
          setTimeout(fetchDbInfo, 500);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error connecting to server');
        setLoading(false);
      }
    };

    fetchDbInfo();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {

        const response = await fetch(`${url}/classes`
          , {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': sessionStorage.getItem('adminUserId'),
            'x-user-password': sessionStorage.getItem('adminPassword')
          }} 
        );

        const data = await response.json();
        console.log('Fetched classes:', data); // Debugging line
        if (Array.isArray(data)) {
          setClasses(data);
          
        } else {
          console.error('Unexpected data format:', data);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to fetch classes');
      }
    };
    fetchClasses();
  }, []);

  const handleDelete = async (studentId, rollNumber, className) => {
    //confirm box
    
    const a=window.confirm("Are you sure you want to delete this Student?")
    if(!a){
      return
    }
    try {
      const response = await fetch(`${url}/deleteStudent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('adminUserId'),
          'x-user-password': sessionStorage.getItem('adminPassword')
        },
        body: JSON.stringify({ studentId, rollNumber, className })
         // Debugging line
      });

      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message);
        setStudents(students.filter((student) => student.rollNumber !== rollNumber));
        setAllStudents(allStudents.filter((student) => student.rollNumber !== rollNumber)); // Update allStudents as well
      }
      console.log('Deleting student:', { studentId, rollNumber, className });
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete student');
    }
  };
  

const sortByClass = (e) => {
  const selectedClass = e.target.value;

  if (selectedClass === 'all') {
    setStudents(allStudents);
  } else {
    const filtered = allStudents.filter(student => student.class === selectedClass);
    setStudents(filtered);
  }
};

  return (
    <>
      <h1 className="db-connection-status">
  {error
    ? error
    : loading
    ? 'Loading...'
    : `${dbName}`}
</h1>


          <button className="add-student-button" onClick={() => setDisplay('flex')}>
  Add Student
</button>

{!loading && !error && (
  <div className="student-section">
    <h2 className="student-list-heading">Students List:</h2>

    <select name="class" className="class-filter-select" onChange={sortByClass}>
      <option value="all" selected>All Classes</option>
      {classes.map((classItem, index) => (
        <option key={index} value={classItem.className}>{classItem.className}</option>
      ))}
    </select>

    {students.length === 0 ? (
      <p className="no-students-message">No students found.</p>
    ) : (
      <table className="student-table" border={1} cellPadding={5} cellSpacing={0}>
        <thead>
          <tr className="student-table-header">
            <th>Name</th>
            <th>Class</th>
            <th>Roll No</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student._id || index} className="student-row">
              <td>{student.name}</td>
              <td>{student.class}</td>
              <td>{student.rollNumber}</td>
              <td className="action-cell">
                <button onClick={() => handleDelete(student._id,student.rollNumber,student.class)} className="delete-student-button">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}

     
      <div className="add-student-container" style={{ display: display }}>
  <div className="add-student-box">
    <button className="close-add-student-button" onClick={() => setDisplay('none')}>BACK</button>
    <h2 className="add-student-title">Add Student</h2>

    <form
      className="add-student-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const className = e.target.className.value;
        const rollNumber = e.target.rollNumber.value;

        if (!name || !className || !rollNumber) {
          alert('Please fill in all fields');
          return;
        }

        try {
          const response = await fetch(`${url}/addStudent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': sessionStorage.getItem('adminUserId'),
              'x-user-password': sessionStorage.getItem('adminPassword'),
            },
            body: JSON.stringify({ name, class: className, rollNumber }),
          });

          const data = await response.json();
          if (data.error) {
            alert(data.error);
          } else {
            alert(data.message);
            const newStudent = { name, class: className, rollNumber };
            setStudents([...students, newStudent]);
            setAllStudents([...allStudents, newStudent]);
            e.target.reset();
            setDisplay('none');
          }
        } catch (err) {
          console.error('Error:', err);
          alert('Failed to add student');
        }
      }}
    >
      <input
        type="text"
        name="name"
        placeholder="Name"
        required
        className="student-input name-input"
      />
      <select name="className" required className="student-select class-select">
        <option value="" disabled selected>Select Class</option>
        {classes.map((classItem, index) => (
          <option key={index} value={classItem.className}>
            {classItem.className}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="rollNumber"
        placeholder="Roll Number"
        required
        className="student-input roll-input"
      />
      <button type="submit" className="submit-add-student-button">
        Add Student
      </button>
    </form>
  </div>
</div>

    </>
  );
};

export default AddStudents;
