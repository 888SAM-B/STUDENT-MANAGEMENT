import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admindashboard.css';
const url = import.meta.env.VITE_URL;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [dbName, setDbName] = useState('');

    useEffect(() => {

        document.body.style.background = 'linear-gradient(to right, #083f66, #0e204d)';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.fontFamily = '"Roboto Condensed", sans-serif';

        const userId = sessionStorage.getItem('adminUserId');
        const password = sessionStorage.getItem('adminPassword');

        if (!userId || !password) {
            alert("Session expired. Please log in again.");
            navigate('/adminlogin');
            return;
        }

        const fetchDbInfo = async () => {
            try {
                const response = await fetch(`${url}/currentDb`, {
                    headers: {
                        'x-user-id': userId,
                        'x-user-password': password
                    }
                });

                const data = await response.json();

                if (data.error) {
                    alert(data.error);
                    navigate('/adminlogin');
                } else {
                    setDbName(data.dbName);
                }
            } catch (err) {
                console.error('Error fetching DB info:', err);
                alert('Failed to fetch DB info');
            }
        };

        fetchDbInfo();

        // 🧹 Cleanup styles when component unmounts
        return () => {
            document.body.style.background = '';
            document.body.style.margin = '';
            document.body.style.padding = '';
            document.body.style.fontFamily = '';
        };
    }, [navigate]);

    return (
        <div className="admin-dashboard-container">
            <h1 className="db-status-heading">
                {dbName ? `Connected to: ${dbName}` : 'Connecting to DataBase...'}
            </h1>
            <h2 className="admin-dashboard-title">Admin Dashboard</h2>
            <p className="admin-welcome-text">Welcome to the admin dashboard!</p>
            <p className="admin-instruction-text">Here you can manage the institution's data.</p>

            <div className="admin-button-group">
                <button
                    className="admin-btn admin-students-btn"
                    title="Add or edit Student Details"
                    onClick={() => navigate('/addStudents')}
                >
                    Students
                </button>
                <button
                    className="admin-btn admin-staff-btn"
                    title="Add or edit Staff Details"
                    onClick={() => navigate('/addStaff')}
                >
                    Staff
                </button>
                <button
                    className="admin-btn admin-classes-btn"
                    title="Add or Remove Classes"
                    onClick={() => navigate('/addClasses')}
                >
                    Class
                </button>
                <button
                    className="admin-btn admin-classes-btn"
                    title="Add or Remove Classes"
                    onClick={() => navigate('/class_list')}
                >
                    View Attendance
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
