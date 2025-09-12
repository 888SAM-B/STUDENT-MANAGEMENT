import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Adminlogin.css';
const url = import.meta.env.VITE_URL;

const Adminlogin = () => {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const userId = e.target.userId.value.trim();
        const password = e.target.password.value.trim();

        if (!userId || !password) {
            alert('Please fill in all fields');
            return;
        }

        fetch(`${url}/adminLogin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userId.replace(/\s+/g, ''), password: password.replace(/\s+/g, '') }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.message);
                sessionStorage.setItem('adminUserId', userId);
                sessionStorage.setItem('adminPassword', password);
                navigate('/admindashboard', { replace: true });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Login failed');
        });
    };

    const togglePasswordVisibility = () => {
        const passwordField = document.getElementById('password');
        passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
    };

    return (
        <div className='container'>
            <h1>Admin Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="userId" className="form-label">User ID</label>
                    <input type="text" name="userId" className="form-control" id="userId" />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" name="password" className="form-control" id="password" />
                    <div className="form-check mt-2">
                        <input type="checkbox" className="form-check-input" id="showPassword" onClick={togglePasswordVisibility} />
                        <label className="form-check-label" htmlFor="showPassword">Show Password</label>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">Login</button>
            </form>
        </div>
    );
};

export default Adminlogin;
