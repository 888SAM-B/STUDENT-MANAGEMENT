import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './createinstitution.css';

const url = import.meta.env.VITE_URL;

const CreateInstitution = () => {
  const navigate = useNavigate();
  useEffect(() => {
    
    document.body.style.background = 'linear-gradient(to right, #083f66, #0e204d)';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = '"Roboto Condensed", sans-serif';
    

    
    return () => {
      document.body.style.background = '';
      document.body.style.color = '';
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dbName = e.target.institutionName.value;
    const location = e.target.location.value;
    const userId = e.target.userId.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    fetch(`${url}/createdb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dbName, location, userId, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Institution created:', data);
        alert(data.message || data.error || 'Institution created successfully');
        if (data.message) {
          navigate('/adminlogin', { replace: true });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Error creating institution');
      });
  };

  return (
    <div className="container">
      <h1 style={{color:"white"}} >Create Institution</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="institutionName" className="form-label">Institution Name</label>
          <input type="text" className="form-control" id="institutionName" required />
        </div>
        <div className="mb-3">
          <label htmlFor="location" className="form-label">Location</label>
          <input type="text" className="form-control" id="location" required />
        </div>
        <div className="mb-3">
          <label htmlFor="userId" className="form-label">User Id</label>
          <input type="text" className="form-control" id="userId" required />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input type="password" className="form-control" id="password" required />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input type="password" className="form-control" id="confirmPassword" required />
        </div>
        <button type="submit" className="btn btn-primary">Create</button>
      </form>
    </div>
  );
};

export default CreateInstitution;
