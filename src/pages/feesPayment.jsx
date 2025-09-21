import React, { useEffect, useState, useMemo } from 'react';
// We'll add some basic CSS for the table and modal
import './feesPayment.css';

const API_URL = import.meta.env.VITE_URL || 'http://localhost:5000'; // Corrected port if your backend runs on 5000

const FeesPayment = () => {
    const [feesData, setFeesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the payment modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feesToMarkPaid, setFeesToMarkPaid] = useState({}); // Stores { feeId: true/false } for checkboxes
    const [paymentAmount, setPaymentAmount] = useState(''); // State for the payment amount input

    useEffect(() => {
        fetchFeesData();
    }, []);

    const fetchFeesData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/allStudentsFees`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': sessionStorage.getItem('adminUserId'),
                    'x-user-password': sessionStorage.getItem('adminPassword'),
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setFeesData(data);
        } catch (error) {
            console.error('Error fetching fees data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaymentClick = (student) => {
        setSelectedStudent(student);
        // Initialize feesToMarkPaid based on current pending fees for this student
        const initialFeesToMarkPaid = {};
        if (student.feeDetails && student.feeDetails.allFees) {
            student.feeDetails.allFees.forEach(fee => {
                // Only initialize for fees that are still pending
                if (fee.pendingAmount > 0) {
                    initialFeesToMarkPaid[fee._id] = false;
                }
            });
        }
        setFeesToMarkPaid(initialFeesToMarkPaid);
        setPaymentAmount(''); // Clear any previous payment amount
        setShowPaymentModal(true);
    };

    const handleCheckboxChange = (feeId) => {
        setFeesToMarkPaid(prev => ({
            ...prev,
            [feeId]: !prev[feeId]
        }));
    };

    const handlePaymentAmountChange = (e) => {
        setPaymentAmount(e.target.value);
    };

    const handleUpdatePayment = async () => {
        if (!selectedStudent || !selectedStudent._id) {
            alert("No student selected or student ID is missing for payment update.");
            return;
        }

        const paymentsToAdd = [];
        let totalPayment = 0;

        // Iterate through all fees to find selected pending ones
        selectedStudent.feeDetails.allFees.forEach(fee => {
            if (feesToMarkPaid[fee._id] && fee.pendingAmount > 0) {
                paymentsToAdd.push({
                    feeName: fee.feeName,
                    amount: fee.pendingAmount, // Mark the full pending amount as paid
                    date: new Date().toISOString()
                });
                totalPayment += fee.pendingAmount;
            }
        });

        // If a general payment amount is entered AND no specific fees were checked
        if (paymentAmount && parseFloat(paymentAmount) > 0 && paymentsToAdd.length === 0) {
            paymentsToAdd.push({
                feeName: "General Payment", // Or a more specific default like "Partial Fee Payment"
                amount: parseFloat(paymentAmount),
                date: new Date().toISOString()
            });
            totalPayment = parseFloat(paymentAmount);
        }

        if (paymentsToAdd.length === 0 && (!paymentAmount || parseFloat(paymentAmount) <= 0)) {
            alert("Please select fees to mark paid or enter a payment amount.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/updateStudentFees/${selectedStudent._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': sessionStorage.getItem('adminUserId'),
                    'x-user-password': sessionStorage.getItem('adminPassword'),
                },
                body: JSON.stringify({
                    paymentsToAdd: paymentsToAdd,
                    totalPaymentMade: totalPayment
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update fees: ${response.status} - ${errorText}`);
            }

            fetchFeesData(); // Refetch fees data to update the table
            setShowPaymentModal(false); // Close the modal
            alert('Fees updated successfully!');
        } catch (error) {
            console.error('Error updating fees:', error);
            setError(error.message);
            alert(`Error updating fees: ${error.message}`);
        }
    };

    // Calculate totals for the footer
    const totalFeesPosted = useMemo(() => {
        return feesData.reduce((sum, student) => sum + (student.feeDetails?.totalDue || 0), 0);
    }, [feesData]);

    const totalFeesPaidOverall = useMemo(() => {
        return feesData.reduce((sum, student) => sum + (student.feeDetails?.totalPaid || 0), 0);
    }, [feesData]);

    if (loading) return <div>Loading fees data...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (feesData.length === 0) return <div>No fees data available.</div>;

    return (
        <div className="fees-payment-container">
            <h1 style={{color:"#000"}}>Fees Payment Overview</h1>

            <table className="fees-table">
                <thead>
                    <tr>
                        <th>Register No.</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Total Due</th>
                        <th>Total Paid</th>
                        <th>Pending Amount</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {feesData.map((student) => {
                        const totalDue = student.feeDetails?.totalDue || 0;
                        const totalPaid = student.feeDetails?.totalPaid || 0;
                        const pendingAmount = student.feeDetails?.totalPending || 0;
                        return (
                            <tr key={student._id}>
                                <td>{student.rollNumber}</td>
                                <td>{student.name}</td>
                                <td>{student.class}</td>
                                <td>${totalDue.toFixed(2)}</td>
                                <td>${totalPaid.toFixed(2)}</td>
                                <td style={{ color: pendingAmount > 0 ? 'orange' : 'green' }}>
                                    ${pendingAmount.toFixed(2)}
                                </td>
                                <td>
                                    <button
                                        className="mark-payment-btn"
                                        onClick={() => handleMarkPaymentClick(student)}
                                        // The button is always enabled, but actions within the modal can be limited.
                                        // If you still want to disable it if NO fees are pending AT ALL:
                                        // disabled={pendingAmount <= 0}
                                    >
                                        Manage Payment
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="3"></td>
                        <td><strong>Total Posted:</strong> ${totalFeesPosted.toFixed(2)}</td>
                        <td colSpan="2"><strong>Total Paid:</strong> ${totalFeesPaidOverall.toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            {/* Payment Modal */}
            {showPaymentModal && selectedStudent && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Manage Payment for {selectedStudent.name} (Roll No: {selectedStudent.rollNumber})</h2>
                        <p>Total Due: ${selectedStudent.feeDetails.totalDue.toFixed(2)}</p>
                        <p>Total Paid: ${selectedStudent.feeDetails.totalPaid.toFixed(2)}</p>
                        <p>Total Pending: <span style={{ color: selectedStudent.feeDetails.totalPending > 0 ? 'orange' : 'green' }}>
                            ${selectedStudent.feeDetails.totalPending.toFixed(2)}
                        </span></p>

                        <h3>All Fee Items:</h3>
                        <ul className="all-fees-list">
                            {selectedStudent.feeDetails.allFees.map((fee) => (
                                <li key={fee._id} className={fee.status.toLowerCase().replace(' ', '-')}>
                                    {fee.pendingAmount > 0 ? (
                                        <input
                                            type="checkbox"
                                            id={`fee-${fee._id}`}
                                            checked={feesToMarkPaid[fee._id] || false}
                                            onChange={() => handleCheckboxChange(fee._id)}
                                        />
                                    ) : (
                                        <span className="status-icon">✅</span> // Checkmark for fully paid
                                    )}
                                    <label htmlFor={`fee-${fee._id}`}>
                                        {fee.feeName}: Original ${fee.originalAmount.toFixed(2)}
                                        {fee.paidAmountForThisFee > 0 && ` (Paid: $${fee.paidAmountForThisFee.toFixed(2)})`}
                                        {fee.pendingAmount > 0 && ` (Pending: $${fee.pendingAmount.toFixed(2)})`}
                                    </label>
                                    <span className={`fee-status status-${fee.status.toLowerCase().replace(' ', '-')}`}>
                                        {fee.status}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* {selectedStudent.feeDetails.totalPending > 0 && (
                            <div className="payment-input-section">
                                <label htmlFor="paymentAmount">Or enter a total payment amount for pending fees:</label>
                                <input
                                    type="number"
                                    id="paymentAmount"
                                    value={paymentAmount}
                                    onChange={handlePaymentAmountChange}
                                    placeholder="e.g., 500.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        )} */}

                        <div className="modal-actions">
                            <button
                                className="update-btn"
                                onClick={handleUpdatePayment}
                                disabled={selectedStudent.feeDetails.totalPending <= 0 && (!paymentAmount || parseFloat(paymentAmount) <= 0)}
                            >
                                Update Payment
                            </button>
                            <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeesPayment;