import React, { useEffect, useRef, useState } from 'react';
import './addClasses.css';

const url = import.meta.env.VITE_URL;

  

const AddClasses = () => {
  const [display, setDisplay] = useState('none');
  const [classes, setClasses] = useState([]);
  const inputRef = useRef(null);



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
    if (display === 'flex' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [display]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const className = e.target.name.value;

    try {
      const response = await fetch(`${url}/addClass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('adminUserId'),
          'x-user-password': sessionStorage.getItem('adminPassword'),
        },
        body: JSON.stringify({ className }),
      });

      const data = await response.json();
      alert(data.message || data.error);
      if (!data.error) {
        setClasses([...classes, { className, _id: data.id || Date.now() }]);
        setDisplay('none');
        e.target.reset();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add class');
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`All Data Inside Class "${className}" Will Be Deleted? `)) return;

    try {
      const response = await fetch(`${url}/deleteClass/${classId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('adminUserId'),
          'x-user-password': sessionStorage.getItem('adminPassword'),
        },
        body: JSON.stringify({ className }),
      });

      const data = await response.json();
      alert(data.message || data.error);
      if (!data.error) {
        setClasses(classes.filter(cls => cls._id !== classId));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete class');
    }
  };

  return (
    <>
  <h1 className="class-page-title">Add Classes</h1>

  <button className="add-class-button" onClick={() => setDisplay('flex')}>
    Add Class
  </button>

  <div className="class-list-container">
   {classes.length === 0 ? (
  <p className="no-classes-text" style={{ color: 'gray' }}>No classes available</p>
) : (
  classes.map((cls, idx) => (
    <div className="class-card" key={cls._id || idx}>
      <h2 className="class-name">{cls.className}</h2>
      <button
        title="Delete Class"
        className="delete-class-button"
        onClick={() => handleDeleteClass(cls._id, cls.className)}
      >
        X
      </button>
    </div>
  ))
)}

  </div>

  <div className="add-class-modal-overlay">
    <div className="add-class-modal" style={{ display }}>
      <div className="add-class-form-container">
        <button className="close-add-class-button" onClick={() => setDisplay('none')}>
          X
        </button>
        <h2 className="add-class-title">Add Class</h2>
        <form onSubmit={handleSubmit} className="add-class-form">
          <input
            type="text"
            name="name"
            id="className"
            placeholder="Class Name"
            required
            ref={inputRef}
            className="class-name-input"
          />
          <button type="submit" className="submit-add-class-button">
            Add Class
          </button>
        </form>
      </div>
    </div>
  </div>
</>

  );
};

export default AddClasses;
