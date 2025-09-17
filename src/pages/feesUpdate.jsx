import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { useLocation } from 'react-router-dom';

const FeesUpdate = () => {
    const [className, setClassName] = useState('');
    const [students, setStudents] = useState([]); // This should ideally contain rollNumbers
    const location = useLocation();

    // State for the fee structure to apply to all selected students
    const [feesToApply, setFeesToApply] = useState([{ feeName: '', amount: '' }]);

    useEffect(() => {
        if (location.state) {
            setClassName(location.state.className || "");
            // Assuming location.state.students provides objects with at least rollNumber
            // For example: [{ _id: '...', name: '...', rollNumber: 'S001', class: '10A' }]
            setStudents(location.state.students || []);
        }
    }, [location]);

    
        const adminUserId = sessionStorage.getItem('adminUserId'); // Replace with actual admin user ID
        const adminPassword = sessionStorage.getItem('adminPassword'); // Replace with actual admin password
    

    const handleFeeChange = (index, field, value) => {
        const newFees = [...feesToApply];
        newFees[index][field] = value;
        setFeesToApply(newFees);
    };

    const handleAddFee = () => {
        setFeesToApply([...feesToApply, { feeName: '', amount: '' }]);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();

        // Prepare the payload for the backend's /setStudentFees route
        // Each student will have the same fees defined in feesToApply
        const payload = {
            className: className,
            students: students.map(student => ({
                rollNumber: student.rollNumber,
                fees: feesToApply.map(fee => ({
                    feeName: fee.feeName.trim(),
                    amount: fee.amount ? parseFloat(fee.amount) : 0
                })).filter(fee => fee.feeName && fee.amount !== null && fee.amount !== undefined) // Ensure valid fee entries
            }))
        };

        console.log('Submitting fees payload:', payload);

        try {
            // Use the new /setStudentFees route
            const res = await fetch(`${import.meta.env.VITE_URL}/setStudentFees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Assuming admin credentials are still needed for this action
                    // You might need to retrieve these from context/auth
                    'x-user-id': adminUserId,
                    'x-user-password': adminPassword
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Server error: ${res.status} - ${errorData.details || errorData.error}`);
            }

            const data = await res.json();
            console.log('Fees set successfully:', data);
            alert('Fees updated successfully for all students in the class!');
            // Optionally clear inputs or refresh data
            // setFeesToApply([{ feeName: '', amount: '' }]);
        } catch (err) {
            console.error('Failed to set student fees', err);
            alert(`Error setting fees: ${err.message}`);
        }
    };

    return (
        <div>
            <h2>Define Fees for Class: {className}</h2>

            {students.length === 0 ? (
                <p>No students available in this class to set fees for.</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <h3>Fee Structure to Apply to All {students.length} Students:</h3>
                    {feesToApply.map((fee, index) => (
                        <div key={index}>
                            <label>
                                Fee Name:{' '}
                                <input
                                    type="text"
                                    value={fee.feeName}
                                    onChange={(e) => handleFeeChange(index, 'feeName', e.target.value)}
                                    placeholder="e.g. Tuition"
                                    required
                                />
                            </label>
                            {' '}
                            <label>
                                Amount:{' '}
                                <input
                                    type="number"
                                    step="0.01"
                                    value={fee.amount}
                                    onChange={(e) => handleFeeChange(index, 'amount', e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    required
                                />
                            </label>
                            {/* Optional: Add a button to remove a fee row */}
                            {feesToApply.length > 1 && (
                                <button type="button" onClick={() => setFeesToApply(feesToApply.filter((_, i) => i !== index))}>
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={handleAddFee}>Add Another Fee Type</button>
                    <br /><br />
                    <button type="submit">Apply Fees to All Students in Class</button>{' '}
                    <button type="button" onClick={() => console.log({ className, students, feesToApply })}>Check Current State</button>
                </form>
            )}
        </div>
    );
};

export default FeesUpdate;