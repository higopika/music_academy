import React, { useEffect, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const API_BASE_URL = "http://localhost:8000";

const RecordPayment = () => {
    const history = useHistory();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preSelectedStudent = queryParams.get('student');
    const fromPage = queryParams.get('from') || 'dashboard';
    
    const backUrl = fromPage === 'payments' ? '/payments' : '/';
    const backLabel = fromPage === 'payments' ? '← Back to Payments' : '← Back to Dashboard';

    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({
        student_id: preSelectedStudent || '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        status: 'Paid',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/students/`);
            const data = response.data?.data || [];
            // Filter only students
            const studentsList = data.filter(s => s.is_student === true || s.is_student === "true");
            setStudents(studentsList);
            setLoadingStudents(false);
        } catch (err) {
            console.error('Error fetching students:', err);
            setLoadingStudents(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const paymentData = {
                student_id: parseInt(formData.student_id),
                amount: parseFloat(formData.amount),
                due_date: formData.due_date,
                payment_date: formData.payment_date,
                payment_method: formData.payment_method,
                status: formData.status,
                notes: formData.notes || null
            };
            
            await axios.post(`${API_BASE_URL}/payments`, paymentData);
            
            setSuccess(true);
            setTimeout(() => {
                history.push('/payments');
            }, 1500);
        } catch (err) {
            console.error('Error recording payment:', err);
            setError(err.response?.data?.detail || 'Failed to record payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectedStudent = students.find(s => s.user_id === parseInt(formData.student_id));

    return (
        <div className="main-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Record Payment</h1>
                    <p className="page-subtitle">Record a fee payment for a student</p>
                </div>
                <Link to={backUrl} style={{
                    padding: '10px 20px',
                    background: '#f0f0f0',
                    color: '#333',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}>
                    {backLabel}
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* Form Container */}
                <div className="table-container">
                    <div className="table-header">
                        <h2 className="table-title">Payment Details</h2>
                    </div>

                    {success && (
                        <div style={{
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            padding: '15px 20px',
                            margin: '20px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span>✅</span> Payment recorded successfully! Redirecting...
                        </div>
                    )}

                    {error && (
                        <div style={{
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '15px 20px',
                            margin: '20px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                        {/* Student Selection */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#333'
                            }}>
                                Select Student *
                            </label>
                            {loadingStudents ? (
                                <div style={{ padding: '12px', color: '#6c757d' }}>Loading students...</div>
                            ) : (
                                <select
                                    name="student_id"
                                    value={formData.student_id}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 15px',
                                        border: '1px solid #e0e6ed',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        background: 'white'
                                    }}
                                >
                                    <option value="">-- Select a student --</option>
                                    {students.map(student => (
                                        <option key={student.user_id} value={student.user_id}>
                                            {student.name} (ID: {student.user_id})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Amount Field */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#333'
                            }}>
                                Amount (₹) *
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="1"
                                placeholder="Enter amount"
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '1px solid #e0e6ed',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Payment Date */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#333'
                            }}>
                                Payment Date *
                            </label>
                            <input
                                type="date"
                                name="payment_date"
                                value={formData.payment_date}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '1px solid #e0e6ed',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Payment Method */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#333'
                            }}>
                                Payment Method *
                            </label>
                            <select
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '1px solid #e0e6ed',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    background: 'white'
                                }}
                            >
                                <option value="Cash">💵 Cash</option>
                                <option value="UPI">📱 UPI</option>
                                <option value="Card">💳 Card</option>
                                <option value="Bank Transfer">🏦 Bank Transfer</option>
                                <option value="Cheque">📝 Cheque</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#333'
                            }}>
                                Notes (Optional)
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any additional notes..."
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    border: '1px solid #e0e6ed',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '14px 25px',
                                    background: loading 
                                        ? '#ccc' 
                                        : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" style={{ 
                                            width: '20px', 
                                            height: '20px',
                                            borderWidth: '2px'
                                        }}></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span>💰</span> Record Payment
                                    </>
                                )}
                            </button>
                            <Link to={backUrl} style={{
                                padding: '14px 25px',
                                background: '#f5f5f5',
                                color: '#666',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Payment Summary Card */}
                <div className="table-container" style={{ height: 'fit-content' }}>
                    <div className="table-header">
                        <h2 className="table-title">Payment Summary</h2>
                    </div>
                    <div style={{ padding: '20px' }}>
                        {selectedStudent ? (
                            <>
                                <div style={{ 
                                    textAlign: 'center',
                                    padding: '20px',
                                    background: '#f8f9ff',
                                    borderRadius: '12px',
                                    marginBottom: '20px'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 10px',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '20px'
                                    }}>
                                        {selectedStudent.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <h3 style={{ margin: '0 0 5px', color: '#1a1a2e' }}>{selectedStudent.name}</h3>
                                    <p style={{ margin: 0, color: '#6c757d', fontSize: '13px' }}>
                                        ID: {selectedStudent.user_id}
                                    </p>
                                </div>
                                
                                <div style={{ borderTop: '1px dashed #e0e6ed', paddingTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ color: '#6c757d' }}>Amount</span>
                                        <span style={{ fontWeight: '600' }}>
                                            ₹{formData.amount ? parseInt(formData.amount).toLocaleString() : '0'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ color: '#6c757d' }}>Date</span>
                                        <span>{formData.payment_date}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6c757d' }}>Method</span>
                                        <span>{formData.payment_method}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#6c757d' }}>
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>👤</div>
                                <p>Select a student to see payment summary</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordPayment;
