import React, { useState, useEffect } from 'react';
import { Link, useHistory, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const API_BASE_URL = "http://localhost:8000";

const AddStudent = () => {
    const history = useHistory();
    const location = useLocation();
    const { id } = useParams(); // Get ID from URL if editing
    const isEditMode = !!id;
    
    // Check where user came from
    const queryParams = new URLSearchParams(location.search);
    const fromPage = queryParams.get('from') || 'dashboard';
    const backUrl = fromPage === 'students' ? '/students' : '/';
    const backLabel = fromPage === 'students' ? '← Back to Students' : '← Back to Dashboard';
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        is_student: true,
        is_teacher: false
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch student data if editing
    useEffect(() => {
        if (isEditMode) {
            fetchStudentData();
        }
    }, [id]);

    const fetchStudentData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/students/${id}`);
            const student = response.data;
            setFormData({
                name: student.name || '',
                email: student.email || '',
                phone: student.phone || '',
                is_student: student.is_student === true || student.is_student === "true",
                is_teacher: student.is_teacher === true || student.is_teacher === "true"
            });
            setLoadingData(false);
        } catch (err) {
            console.error('Error fetching student:', err);
            setError('Failed to load student data');
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditMode) {
                // Update existing student
                await axios.put(`${API_BASE_URL}/students/${id}`, formData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Student updated');
                setSuccess(true);
                setTimeout(() => {
                    history.push('/students');
                }, 1500);
            } else {
                // Create new student
                const response = await axios.post(`${API_BASE_URL}/user`, formData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Student added:', response.data);
                setSuccess(true);
                setTimeout(() => {
                    history.push('/students');
                }, 1500);
            }
        } catch (err) {
            console.error('Error saving student:', err);
            setError(err.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'add'} student. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="main-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p style={{ marginTop: '15px', color: '#6c757d' }}>Loading student data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">{isEditMode ? 'Edit Student' : 'Add New Student'}</h1>
                    <p className="page-subtitle">{isEditMode ? 'Update student information' : 'Register a new student to the academy'}</p>
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

            {/* Form Container */}
            <div className="table-container" style={{ maxWidth: '600px' }}>
                <div className="table-header">
                    <h2 className="table-title">{isEditMode ? 'Update Information' : 'Student Information'}</h2>
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
                        <span>✅</span> Student {isEditMode ? 'updated' : 'added'} successfully! Redirecting...
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
                    {/* Name Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter full name"
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

                    {/* Email Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            Email Address *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter email address"
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

                    {/* Phone Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="+91 9999999999"
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                border: '1px solid #e0e6ed',
                                borderRadius: '8px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <small style={{ color: '#6c757d', fontSize: '12px' }}>
                            Format: +91 followed by 10 digits
                        </small>
                    </div>

                    {/* Role Checkboxes */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontWeight: '500',
                            color: '#333'
                        }}>
                            Role
                        </label>
                        <div style={{ display: 'flex', gap: '25px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    name="is_student"
                                    checked={formData.is_student}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>🎓 Student</span>
                            </label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    name="is_teacher"
                                    checked={formData.is_teacher}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>👨‍🏫 Teacher</span>
                            </label>
                        </div>
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
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <span>+</span> Add Student
                                </>
                            )}
                        </button>
                        <Link to="/students" style={{
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
        </div>
    );
};

export default AddStudent;
