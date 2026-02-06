import react, {useEffect,useState, useContext} from 'react'
import { Link, useHistory } from 'react-router-dom'
import ProductsRow from './productsRow'
import { ProductContext, ProductProvider } from '../ProductContext'
import axios from "axios";
import '../App.css';

// API Base URL - FastAPI backend
const API_BASE_URL = "http://localhost:8000";

const ProductsTable = () => {
    const [products, setProducts] = useState({ "data": [] })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const history = useHistory();
    console.log("In ProductsTable")

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = () => {
        setLoading(true)
        setError(null)
        axios.get(`${API_BASE_URL}/students/`)
        .then((response) => {
            console.log("API Response:", response.data)
            // Handle the response - API returns { data: [...] }
            if (response.data && response.data.data) {
                setProducts(response.data)
            } else if (Array.isArray(response.data)) {
                // In case API returns array directly
                setProducts({ data: response.data })
            } else {
                setProducts({ data: [] })
            }
            setLoading(false)
        })
        .catch((error) => {
            console.log("API Error:", error)
            setError("Failed to connect to the server. Make sure the backend is running.")
            setLoading(false)
        });
    };

    // Filter products based on search term
    const filteredProducts = products.data.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.phone?.includes(searchTerm)
    );

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Count stats from actual data
    const totalStudents = products.data.filter(p => p.is_student === true || p.is_student === "true").length;
    const totalTeachers = products.data.filter(p => p.is_teacher === true || p.is_teacher === "true").length;

    // Handle view student
    const handleView = (userId) => {
        history.push(`/students/${userId}?from=students`);
    };

    // Handle edit student - go to edit form
    const handleEdit = (userId) => {
        history.push(`/students/edit/${userId}?from=students`);
    };

    // Handle delete student
    const handleDelete = async (userId, userName) => {
        if (deleteConfirm === userId) {
            try {
                await axios.delete(`${API_BASE_URL}/students/${userId}`);
                // Refresh the list after deletion
                fetchStudents();
                setDeleteConfirm(null);
            } catch (err) {
                console.error('Error deleting student:', err);
                alert('Failed to delete student. Please try again.');
                setDeleteConfirm(null);
            }
        } else {
            // First click - ask for confirmation
            setDeleteConfirm(userId);
            // Reset confirmation after 3 seconds
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    console.log(products.data)
    return(
        <div className="main-container">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Student Management</h1>
                    <p className="page-subtitle">Manage all students and their fee payments</p>
                </div>
                <Link to="/students/add?from=students" className="btn-add">
                    <span>+</span> Add Student
                </Link>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span>⚠️</span> {error}
                    <button 
                        onClick={fetchStudents}
                        style={{
                            marginLeft: 'auto',
                            background: '#c62828',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="stats-container">
                <div className="stat-card">
                    <div className="stat-number">{products.data.length}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-number">{totalStudents}</div>
                    <div className="stat-label">Students</div>
                </div>
                <div className="stat-card info">
                    <div className="stat-number">{totalTeachers}</div>
                    <div className="stat-label">Teachers</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-number">0</div>
                    <div className="stat-label">Pending Payments</div>
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">All Students & Teachers ({filteredProducts.length})</h2>
                    <div className="table-actions">
                        <div className="search-box">
                            <input 
                                type="text" 
                                placeholder="Search by name, email, phone..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p style={{marginTop: '15px', color: '#6c757d'}}>Loading students...</p>
                    </div>
                ) : error ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">❌</div>
                        <h3 className="empty-state-title">Connection Error</h3>
                        <p>Unable to fetch data from server</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3 className="empty-state-title">
                            {searchTerm ? 'No matching students found' : 'No students found'}
                        </h3>
                        <p>{searchTerm ? 'Try a different search term' : 'Add your first student to get started'}</p>
                    </div>
                ) : (
                    <table className="students-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product, index) => {
                                // Handle boolean values that might come as strings
                                const isStudent = product.is_student === true || product.is_student === "true";
                                const isTeacher = product.is_teacher === true || product.is_teacher === "true";
                                
                                return (
                                    <tr key={product.user_id || index}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {getInitials(product.name)}
                                                </div>
                                                <div>
                                                    <div className="user-name">{product.name || 'Unknown'}</div>
                                                    <div className="user-id">ID: {product.user_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {isStudent && (
                                                <span className="status-badge student">
                                                    🎓 Student
                                                </span>
                                            )}
                                            {isTeacher && (
                                                <span className="status-badge teacher">
                                                    👨‍🏫 Teacher
                                                </span>
                                            )}
                                            {!isStudent && !isTeacher && (
                                                <span className="status-badge" style={{background: '#f5f5f5', color: '#666'}}>
                                                    — None
                                                </span>
                                            )}
                                        </td>
                                        <td>{product.email || '—'}</td>
                                        <td>{product.phone || '—'}</td>
                                        <td>
                                            <span className="status-badge pending">
                                                ⏳ Pending
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="action-btn view"
                                                onClick={() => handleView(product.user_id)}
                                            >
                                                View
                                            </button>
                                            <button 
                                                className="action-btn edit"
                                                onClick={() => handleEdit(product.user_id)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className={`action-btn delete ${deleteConfirm === product.user_id ? 'confirm' : ''}`}
                                                onClick={() => handleDelete(product.user_id, product.name)}
                                                style={deleteConfirm === product.user_id ? {
                                                    background: '#c62828',
                                                    color: 'white'
                                                } : {}}
                                            >
                                                {deleteConfirm === product.user_id ? 'Confirm?' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ProductsTable;
