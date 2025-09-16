import './App.css'
import {Routes,Route} from 'react-router-dom'
import Home from './pages/home'
import CreateInstitution from './pages/createinstitution'
import Adminlogin from './pages/Adminlogin'
import Teacherlogin from './pages/Teacherlogin'
import Studentlogin from './pages/Studentlogin'
import ListOfClasses1 from './pages/listOfClasses1'
import ListOfClasses2 from './pages/listOfClasses2'
import MarkUpdate from './pages/markUpdate'
import StudentDashboard from './pages/studentDashboard'
import Admindashboard from './pages/admindashboard'
import AddStudents from './pages/AddStudents'
import AddStaff from './pages/addStaff'
import AddClasses from './pages/addClasses'
import MarkAttendance from './pages/markAttendance'
import StaffDashboard from './pages/StaffDashboard'
import AttendanceReport from './pages/attendanceReport'
import ListOfClasses3 from './pages/listOfClasses3'
import ListOfClasses4 from './pages/ListOfClasses4'
function App() {
  return (
   <div>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/createinstitution" element={<CreateInstitution/>}/>
        <Route path="/stafflogin" element={<Teacherlogin/>}/>
        <Route path="/studentlogin" element={<Studentlogin/>}/>
        <Route path="/adminlogin" element={<Adminlogin/>}/>
        <Route path="/addStudents" element={<AddStudents/>}/>
        <Route path="/addStaff" element={<AddStaff/>}/>
        <Route path="/class-List" element={<ListOfClasses1/>}/>
        <Route path="/class_List" element={<ListOfClasses2/>}/>
        <Route path="/classlist" element={<ListOfClasses3/>}/>
        <Route path="/classlist2" element={<ListOfClasses4/>}/>
        <Route path="/studentDashboard" element={<StudentDashboard/>}/>
        <Route path="/admindashboard" element={<Admindashboard/>}/>
        <Route path="/addClasses" element={<AddClasses/>}/>
        <Route path="/markAttendance" element={<MarkAttendance/>}/>
        <Route path="/staffDashboard" element={<StaffDashboard/>}/>
        <Route path="/attendanceReport" element={<AttendanceReport/>}/>
        <Route path='/marks-update' element={<MarkUpdate/>}/>
      </Routes>
    </div>
  )
}
export default App;