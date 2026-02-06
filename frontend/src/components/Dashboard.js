import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const API_BASE_URL = "http://localhost:8000";

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        pendingAmount: 0,
        overdueAmount: 0
    });
    const [recentStudents, setRecentStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch dashboard stats from backend
            const [studentsRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/students/`),
                axios.get(`${API_BASE_URL}/dashboard/stats`).catch(() => null)
            ]);
            
            const students = studentsRes.data?.data || [];
            
            // Use backend stats if available, otherwise calculate from students
            if (statsRes && statsRes.data) {
                setStats({
                    totalStudents: statsRes.data.total_students || 0,
                    totalTeachers: statsRes.data.total_teachers || 0,
                    pendingPayments: statsRes.data.total_payments || 0,
                    totalRevenue: statsRes.data.total_revenue || 0,
                    pendingAmount: statsRes.data.pending_amount || 0,
                    overdueAmount: statsRes.data.overdue_amount || 0
                });
            } else {
                // Fallback calculation
                const totalStudents = students.filter(s => s.is_student === true || s.is_student === "true").length;
                const totalTeachers = students.filter(s => s.is_teacher === true || s.is_teacher === "true").length;
                
                setStats({
                    totalStudents,
                    totalTeachers,
                    pendingPayments: 0,
                    totalRevenue: 0,
                    pendingAmount: 0,
                    overdueAmount: 0
                });
            }
            
            // Get recent 5 students
            setRecentStudents(students.slice(-5).reverse());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="main-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome to Music Academy Management System</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-container">
                <div className="stat-card">
                    <div className="stat-number">{stats.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-number">{stats.totalTeachers}</div>
                    <div className="stat-label">Teachers</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-number">{formatCurrency(stats.pendingAmount)}</div>
                    <div className="stat-label">Pending Payments</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-number">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#1a1a2e' }}>
                    Quick Actions
                </h2>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <Link to="/students/add" style={{
                        padding: '15px 25px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '500',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                    }}>
                        <span style={{ fontSize: '20px' }}>👤</span> Add Student
                    </Link>
                    <Link to="/payments/add" style={{
                        padding: '15px 25px',
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '500',
                        boxShadow: '0 4px 15px rgba(17, 153, 142, 0.3)'
                    }}>
                        <span style={{ fontSize: '20px' }}>💰</span> Record Payment
                    </Link>
                    <Link to="/students" style={{
                        padding: '15px 25px',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '500',
                        boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                    }}>
                        <span style={{ fontSize: '20px' }}>📋</span> View Students
                    </Link>
                    <Link to="/payments" style={{
                        padding: '15px 25px',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '500',
                        boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)'
                    }}>
                        <span style={{ fontSize: '20px' }}>📊</span> View Payments
                    </Link>
                </div>
            </div>

            {/* Recent Students */}
            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">Recent Students</h2>
                    <Link to="/students" style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        View All →
                    </Link>
                </div>
                
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : recentStudents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3 className="empty-state-title">No students yet</h3>
                        <p>Add your first student to get started</p>
                        <Link to="/students/add" className="btn-add" style={{ marginTop: '15px' }}>
                            + Add Student
                        </Link>
                    </div>
                ) : (
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentStudents.map((student, index) => (
                                <tr key={student.user_id || index}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {getInitials(student.name)}
                                            </div>
                                            <div>
                                                <div className="user-name">{student.name || 'Unknown'}</div>
                                                <div className="user-id">ID: {student.user_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{student.email || '—'}</td>
                                    <td>{student.phone || '—'}</td>
                                    <td>
                                        <span className="status-badge pending">⏳ Pending</span>
                                    </td>
                                    <td>
                                        <Link to={`/students/${student.user_id}?from=dashboard`} className="action-btn view">
                                            View
                                        </Link>
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

export default Dashboard;
