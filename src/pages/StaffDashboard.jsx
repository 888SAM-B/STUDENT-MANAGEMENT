import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffDashboard.css';
const staffDashboard = () => {
  const navigate = useNavigate();

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

  const handleMarkAttendance = () => {
    navigate('/class-list');
  };

  const handleViewAttendanceReport = () => {
    navigate('/class_list');
  };
  const handleUpdateMarks = () => {
    navigate('/classlist');
  }
  return (
    <div className='staff-dashboard' >
        <h1  >STAFF DASHBOARD</h1>
        <button onClick={handleMarkAttendance}>Mark Attendance</button>
        <button onClick={handleViewAttendanceReport}>View Attendance Report</button>
        <button onClick={handleUpdateMarks}>Update Marks</button>
    </div>
  );
};

export default staffDashboard;
