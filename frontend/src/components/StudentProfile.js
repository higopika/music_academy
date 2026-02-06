import React, { useEffect, useState } from 'react';
import { Link, useParams, useHistory, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const API_BASE_URL = "http://localhost:8000";

const StudentProfile = () => {
    const { id } = useParams();
    const history = useHistory();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const fromPage = queryParams.get('from') || 'dashboard';
    
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payments, setPayments] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Handle edit - navigate to edit form
    const handleEdit = () => {
        history.push(`/students/edit/${id}`);
    };

    // Handle delete
    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await axios.delete(`${API_BASE_URL}/students/${id}`);
                history.push('/students');
            } catch (err) {
                console.error('Error deleting student:', err);
                alert('Failed to delete student. Please try again.');
                setDeleteConfirm(false);
            }
        } else {
            setDeleteConfirm(true);
            setTimeout(() => setDeleteConfirm(false), 3000);
        }
    };

    useEffect(() => {
        fetchStudent();
    }, [id]);

    const fetchStudent = async () => {
        try {
            // Fetch student details and their payments
            const [studentRes, paymentsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/students/${id}`).catch(() => null),
                axios.get(`${API_BASE_URL}/students/${id}/payments`).catch(() => null)
            ]);
            
            if (studentRes && studentRes.data) {
                setStudent(studentRes.data);
            } else {
                // Fallback: Fetch all students and find the one with matching ID
                const allStudentsRes = await axios.get(`${API_BASE_URL}/students/`);
                const students = allStudentsRes.data?.data || [];
                const foundStudent = students.find(s => s.user_id === parseInt(id));
                
                if (foundStudent) {
                    setStudent(foundStudent);
                } else {
                    setError('Student not found');
                }
            }
            
            if (paymentsRes && paymentsRes.data?.data) {
                setPayments(paymentsRes.data.data);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error fetching student:', err);
            setError('Failed to load student details');
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="main-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p style={{ marginTop: '15px', color: '#6c757d' }}>Loading student details...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="main-container">
                <div className="empty-state">
                    <div className="empty-state-icon">❌</div>
                    <h3 className="empty-state-title">{error || 'Student not found'}</h3>
                    <Link to="/students" className="btn-add" style={{ marginTop: '15px' }}>
                        ← Back to Students
                    </Link>
                </div>
            </div>
        );
    }

    const isStudent = student.is_student === true || student.is_student === "true";
    const isTeacher = student.is_teacher === true || student.is_teacher === "true";
    
    const backUrl = fromPage === 'students' ? '/students' : '/';
    const backLabel = fromPage === 'students' ? '← Back to Students' : '← Back to Dashboard';

    return (
        <div className="main-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Student Profile</h1>
                    <p className="page-subtitle">View and manage student information</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                {/* Profile Card */}
                <div className="table-container">
                    <div style={{ 
                        padding: '30px', 
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px 16px 0 0',
                        margin: '-1px -1px 0 -1px'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 15px',
                            fontSize: '36px',
                            fontWeight: '600',
                            color: '#667eea'
                        }}>
                            {getInitials(student.name)}
                        </div>
                        <h2 style={{ color: 'white', marginBottom: '5px', fontSize: '24px' }}>
                            {student.name}
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                            ID: {student.user_id}
                        </p>
                    </div>
                    
                    <div style={{ padding: '25px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                fontSize: '12px', 
                                color: '#6c757d', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Role</label>
                            <div style={{ marginTop: '5px', display: 'flex', gap: '10px' }}>
                                {isStudent && (
                                    <span className="status-badge student">🎓 Student</span>
                                )}
                                {isTeacher && (
                                    <span className="status-badge teacher">👨‍🏫 Teacher</span>
                                )}
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                fontSize: '12px', 
                                color: '#6c757d', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Email</label>
                            <p style={{ 
                                marginTop: '5px', 
                                fontSize: '16px',
                                color: '#333'
                            }}>
                                📧 {student.email || '—'}
                            </p>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                fontSize: '12px', 
                                color: '#6c757d', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>Phone</label>
                            <p style={{ 
                                marginTop: '5px', 
                                fontSize: '16px',
                                color: '#333'
                            }}>
                                📱 {student.phone || '—'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                            <button 
                                className="action-btn edit" 
                                style={{ flex: 1, padding: '12px' }}
                                onClick={handleEdit}
                            >
                                ✏️ Edit
                            </button>
                            <button 
                                className="action-btn delete" 
                                style={{ 
                                    flex: 1, 
                                    padding: '12px',
                                    background: deleteConfirm ? '#c62828' : undefined,
                                    color: deleteConfirm ? 'white' : undefined
                                }}
                                onClick={handleDelete}
                            >
                                {deleteConfirm ? '⚠️ Confirm Delete?' : '🗑️ Delete'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment History & Details */}
                <div>
                    {/* Payment Stats */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '15px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                        }}>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#2e7d32' }}>
                                {formatCurrency(payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>Total Paid</div>
                        </div>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                        }}>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef6c00' }}>
                                {formatCurrency(payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>Pending</div>
                        </div>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                        }}>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1565c0' }}>
                                {formatCurrency(payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>Total Fee</div>
                        </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="table-container">
                        <div className="table-header">
                            <h2 className="table-title">Payment History</h2>
                            <Link to={`/payments/add?student=${id}`} className="btn-add" style={{ 
                                padding: '8px 16px', 
                                fontSize: '13px' 
                            }}>
                                + Record Payment
                            </Link>
                        </div>
                        
                        {payments.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 20px' }}>
                                <div className="empty-state-icon">💰</div>
                                <h3 className="empty-state-title">No payment records</h3>
                                <p>No payment records found for this student</p>
                            </div>
                        ) : (
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>Due Date</th>
                                    <th>Payment Date</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.payment_id}>
                                        <td>{formatDate(payment.due_date)}</td>
                                        <td>{formatDate(payment.payment_date)}</td>
                                        <td style={{ fontWeight: '600' }}>{formatCurrency(payment.amount)}</td>
                                        <td>{payment.payment_method || '—'}</td>
                                        <td>
                                            <span className={`status-badge ${payment.status === 'Paid' ? 'paid' : payment.status === 'Overdue' ? 'overdue' : 'pending'}`}>
                                                {payment.status === 'Paid' ? '✅' : payment.status === 'Overdue' ? '⚠️' : '⏳'} {payment.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="action-btn view">View</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;