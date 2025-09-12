import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Replace with your .env URL
const url = import.meta.env.VITE_URL;

const ListOfClasses2 = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 Loading state
  const navigate = useNavigate();

  // Fetch class list from backend
  const fetchClasses = async () => {
    try {
      setLoading(true); // Start loading
      const response = await fetch(`${url}/classes`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('adminUserId'),
          'x-user-password': sessionStorage.getItem('adminPassword'),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch class list');

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Apply full-page background style
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
        {loading ? (
          <p className="loading-text">Loading classes...</p> 
        ) : classes.length === 0 ? (
          <p className="no-classes-text">No classes available</p>
        ) : (
          classes.map((cls, idx) => (
            <button
              key={cls._id || idx}
              className="class-card-button2"
              onClick={() =>
                navigate('/attendanceReport', {
                  state: { className: cls.className }
                })
              }
            >
              <div className="class-card2">
                <h2 className="class-name-heading2">{cls.className}</h2>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
};

export default ListOfClasses2;
