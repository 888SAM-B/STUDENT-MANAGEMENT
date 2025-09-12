import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './listOfClasses1.css';
const url = import.meta.env.VITE_URL;




const listOfClasses1 = () => {
  const [display, setDisplay] = useState('none');
  const [classes, setClasses] = useState([]);
  const inputRef = useRef(null);
  const  navigate=useNavigate();
  const fetchClasses = async () => {
    try {
      const response = await fetch(`${url}/classes`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('adminUserId'),
          'x-user-password': sessionStorage.getItem('adminPassword'),
        },
      });
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };
  useEffect(() => {
    fetchClasses();
  }, []);

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
 

  return (
    <>
      <h1 className="class-list-title2">LIST OF CLASSES</h1>

<div className="class-list-container2">
  {classes.map((cls, idx) => (
    <button
      key={cls._id || idx}
      className="class-card-button2"
      onClick={() => {
        navigate('/markAttendance', {
          state: {
            students: cls.Students,
            className: cls.className
          }
        });
      }}
    >
      <div className="class-card2">
        <h2 className="class-name-heading2">{cls.className}</h2>
      </div>
    </button>
  ))}
</div>

    </>
  );
};

export default listOfClasses1;
