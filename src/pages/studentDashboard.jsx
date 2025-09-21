import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './studentDashboard.css';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState({});
  const location = useLocation();

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
    const studentData = location.state?.studentData;
    if (!studentData) {
      console.error('No student data found in location state');
      return;
    }
    console.log('Student Data:', studentData);
    setStudentData(studentData);
  }, [location]);

  return (
    <>
      <h1 className="dashboard-title1">Student Dashboard</h1>
      <hr className="dashboard-divider1" />

      <h1 className="dashboard-welcome1">Welcome {studentData?.name || 'N/A'}</h1>
      <h1 className="dashboard-roll1">Roll No: {studentData?.rollNumber || 'N/A'}</h1>
      <h1 className="dashboard-class1">Class: {studentData?.class || 'N/A'}</h1>
      <hr className='dashboard-divider2' />

      <h1 className="dashboard-working-days1">
        Total Working Days: {studentData?.present?.length + studentData?.halfDay?.length + studentData?.absent?.length || 0}
      </h1>

      <h2 className="dashboard-present-count1">Number of Days Present: {studentData?.present?.length || 0}</h2>
      <h2 className="dashboard-halfday-count1">Number of Half Days: {studentData?.halfDay?.length || 0}</h2>
      <h2 className="dashboard-absent-count1">Number of Days Absent: {studentData?.absent?.length || 0}</h2>

      <br />

      <h1 className="dashboard-attendance-title12">Attendance Percentage</h1>
      <h2 className="dashboard-attendance-value8">
        {studentData?.present && studentData?.halfDay && studentData?.absent
          ? (
              ((studentData.present.length + (studentData.halfDay.length / 2)) /
              (studentData.present.length + studentData.halfDay.length + studentData.absent.length)) *
              100
            ).toFixed(2)
          : 0}%
      </h2>

      <h1 className="dashboard-record-title7">Attendance Record</h1>

      <h2 className="dashboard-present-record0">
        Present Days: {studentData?.present?.length
          ? studentData.present
              .map((day) => {
                const [year, month, date] = day.split("-");
                return `${date}-${month}-${year}`;
              })
              .join(", ")
          : "N/A"}
      </h2>

      <h2 className="dashboard-halfday-record55">
        Half Days: {studentData?.halfDay?.length
          ? studentData.halfDay
              .map((day) => {
                const [year, month, date] = day.split("-");
                return `${date}-${month}-${year}`;
              })
              .join(", ")
          : "N/A"}
      </h2>

      <h2 className="dashboard-absent-record23">
        Absent Days: {studentData?.absent?.length
          ? studentData.absent
              .map((day) => {
                const [year, month, date] = day.split("-");
                return `${date}-${month}-${year}`;
              })
              .join(", ")
          : "N/A"}
      </h2>

      <hr className='dashboard-divider2' />

      <h1 className="dashboard-fees-title">Fees Details</h1>
      {studentData?.fees?.length > 0 ? (
        studentData.fees.map((fee, index) => (
          <div key={index} className="dashboard-fee-item">
            <h2 className="dashboard-fee-name">Fee Name: {fee.feeName || 'N/A'}</h2>
            <h2 className="dashboard-fee-amount">Amount: ₹{fee.amount || 'N/A'}</h2>
          </div>
        ))
      ) : (
        <h2 className="dashboard-no-fees">No fees details available.</h2>
      )}

      <h1 className="dashboard-paid-fees-title">Paid Fees</h1>
      {studentData?.paid?.length > 0 ? (
        studentData.paid.map((payment, index) => (
          <div key={index} className="dashboard-paid-item">
            <h2 className="dashboard-paid-feename">Fee Paid For: {payment.feeName || 'N/A'}</h2>
            <h2 className="dashboard-paid-amount">Amount: ₹{payment.amount || 'N/A'}</h2>
            <h2 className="dashboard-paid-date">Date Paid: {payment.date || 'N/A'}</h2>
          </div>
        ))
      ) : (
        <h2 className="dashboard-no-paid-fees">No paid fees details available.</h2>
      )}

      <hr className='dashboard-divider2' />

      <h1 className="dashboard-marks-title">Marks Details (Semester 1)</h1>
      {studentData?.sem1?.length > 0 ? (
        studentData.sem1.map((subject, index) => (
          <div key={index} className="dashboard-subject-item">
            <h2 className="dashboard-subject-name">Subject: {subject.subject || 'N/A'}</h2>
            <h2 className="dashboard-subject-marks">Marks: {subject.marks || 'N/A'}</h2>
          </div>
        ))
      ) : (
        <h2 className="dashboard-no-marks">No marks details available for Semester 1.</h2>
      )}
    </>
  );
};

export default StudentDashboard;