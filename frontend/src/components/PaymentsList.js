import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const API_BASE_URL = "http://localhost:8000";

const PaymentsList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch both students and payments
            const [studentsRes, paymentsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/students/`),
                axios.get(`${API_BASE_URL}/payments`)
            ]);
            
            const studentsData = studentsRes.data?.data || [];
            const paymentsData = paymentsRes.data?.data || [];
            
            setStudents(studentsData);
            
            // Map student names to payments
            const paymentsWithNames = paymentsData.map(payment => {
                const student = studentsData.find(s => s.user_id === payment.student_id);
                return {
                    ...payment,
                    student_name: student?.name || 'Unknown Student'
                };
            });
            
            setPayments(paymentsWithNames);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Filter payments
    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || payment.status?.toLowerCase() === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalPending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalOverdue = payments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid':
                return <span className="status-badge paid">✅ Paid</span>;
            case 'Pending':
                return <span className="status-badge pending">⏳ Pending</span>;
            case 'Overdue':
                return <span className="status-badge overdue">⚠️ Overdue</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
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

    return (
        <div className="main-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payments</h1>
                    <p className="page-subtitle">Track and manage all fee payments</p>
                </div>
                <Link to="/payments/add?from=payments" className="btn-add">
                    <span>+</span> Record Payment
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="stats-container">
                <div className="stat-card success">
                    <div className="stat-number">{formatCurrency(totalPaid)}</div>
                    <div className="stat-label">Total Collected</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-number">{formatCurrency(totalPending)}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)' }}>
                    <div className="stat-number">{formatCurrency(totalOverdue)}</div>
                    <div className="stat-label">Overdue</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-number">{payments.length}</div>
                    <div className="stat-label">Total Records</div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">All Payments ({filteredPayments.length})</h2>
                    <div className="table-actions" style={{ display: 'flex', gap: '10px' }}>
                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '10px 15px',
                                border: '1px solid #e0e6ed',
                                borderRadius: '8px',
                                fontSize: '14px',
                                background: 'white'
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="paid">✅ Paid</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="overdue">⚠️ Overdue</option>
                        </select>
                        {/* Search Box */}
                        <div className="search-box">
                            <input 
                                type="text" 
                                placeholder="Search by student name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p style={{ marginTop: '15px', color: '#6c757d' }}>Loading payments...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💰</div>
                        <h3 className="empty-state-title">
                            {searchTerm || filterStatus !== 'all' ? 'No matching payments found' : 'No payments recorded'}
                        </h3>
                        <p>
                            {searchTerm || filterStatus !== 'all' 
                                ? 'Try adjusting your filters' 
                                : 'Record your first payment to get started'}
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <Link to="/payments/add" className="btn-add" style={{ marginTop: '15px' }}>
                                + Record Payment
                            </Link>
                        )}
                    </div>
                ) : (
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Payment Date</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((payment) => (
                                <tr key={payment.payment_id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {getInitials(payment.student_name)}
                                            </div>
                                            <div>
                                                <div className="user-name">{payment.student_name || 'Unknown'}</div>
                                                <div className="user-id">ID: {payment.student_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600', color: '#1a1a2e' }}>
                                        {formatCurrency(payment.amount)}
                                    </td>
                                    <td>{formatDate(payment.due_date)}</td>
                                    <td>{formatDate(payment.payment_date)}</td>
                                    <td>{payment.payment_method || '—'}</td>
                                    <td>{getStatusBadge(payment.status)}</td>
                                    <td>
                                        <Link 
                                            to={`/students/${payment.student_id}`} 
                                            className="action-btn view"
                                        >
                                            View
                                        </Link>
                                        {payment.status !== 'Paid' && (
                                            <Link 
                                                to={`/payments/add?student=${payment.student_id}`}
                                                className="action-btn edit"
                                            >
                                                Pay
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PaymentsList;