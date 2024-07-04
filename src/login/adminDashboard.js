import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboard.css';
import moment from 'moment-timezone';
import { FaTrash } from 'react-icons/fa';

const Dashboard = () => {
    const [requests, setRequests] = useState([]);
    const [createEmail, setCreateEmail] = useState('');
    const [reports, setReports] = useState([]);
    const [groupedReports, setGroupedReports] = useState({});
    const [denialReason, setDenialReason] = useState({});
    const [createPassword, setCreatePassword] = useState('');
    const [resetEmail, setResetEmail] = useState(''); 
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState(''); 
    const { isLoggedIn, logout } = useAuth();
    const [config, setConfig] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedReport, setExpandedReport] = useState(null);
    const [modalContent, setModalContent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/get-form-config')
        .then(res => res.json())
        .then(data => setConfig(data.config || []))
        .catch(err => console.error('Error loading form config:', err));
    }, []);

    const formatAsIST = (utcDateTime) => {
        return moment.utc(utcDateTime).tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm A');
    };

    const handleSaveConfig = () => {
        fetch('http://localhost:5000/api/save-form-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config })
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error('Failed to save config:', error));
    };

    const handleAddField = () => {
        setConfig([...config, { name: '', type: 'text', options: [], label: '' }]);
    };

    const handleDeleteField = (index) => {
        const newConfig = [...config];
        newConfig.splice(index, 1);
        setConfig(newConfig);
    };

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/');
        }
        fetch('http://localhost:5000/api/booking-requests')
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => console.error('Error fetching booking requests:', err));
        fetch('http://localhost:5000/api/fetch-report-files')
            .then(res => res.json())
            .then(data => groupReportsByBookingId(data))
            .catch(err => console.error('Error fetching report files:', err));
    }, [isLoggedIn, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const updateStatus = (id, newStatus, reason ='') => {
        fetch('http://localhost:5000/api/update-booking-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, newStatus, reason })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
            setDenialReason({...denialReason, [id]: ''});
        })
        .catch(err => console.error('Error updating status:', err));
    };

    const handleCreateAdmin = (event) => {
        event.preventDefault();
        fetch('http://localhost:5000/api/create-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: createEmail, password: createPassword })
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to create admin');
            return res.json();
        })
        .then(() => {
            alert('Admin created successfully');
            setCreateEmail('');
            setCreatePassword('');
        })
        .catch(err => {
            console.error('Error creating admin:', err);
            alert('Failed to create admin. Email may already be in use.');
        });
    };

    const handleResetPassword = (event) => {
        event.preventDefault();
        fetch('http://localhost:5000/api/reset-admin-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: resetEmail, newPassword })
        })
        .then(response => {
            
            if (!response.ok) {
                
                return response.json().then(data => {
                    throw new Error(data.message || 'Network response was not ok');
                });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
        })
        .catch(err => {
            console.error('Error resetting password:', err);
            alert(err.message);
        });
    };

    const handleFieldChange = (index, key, value) => {
        const newConfig = [...config];
        newConfig[index][key] = value;
        if (key === 'type' && value !== 'dropdown') {
            newConfig[index].options = [];
        }
        setConfig(newConfig);
    };

    const handleOptionChange = (index, options) => {
        const newConfig = [...config];
        newConfig[index].options = options.split(',').map(option => option.trim());
        setConfig(newConfig);
    };

    const parseFormContent = (formContent) => {
        try {
            const content = JSON.parse(formContent);
            return (
                <div>
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key}>
                            <strong>{key}:</strong> {value}
                        </div>
                    ))}
                </div>
            );
        } catch (error) {
            console.error("Error parsing form content:", error);
            return null;
        }
    };

    const groupReportsByBookingId = (reports) => {
        const grouped = reports.reduce((acc, report) => {
            if (!acc[report.booking_id]) {
                acc[report.booking_id] = {
                    reportFiles: [],
                    photoFiles: []
                };
            }
            if (report.file_type === 'report') {
                acc[report.booking_id].reportFiles.push(report.file_path);
            } else if (report.file_type === 'photo') {
                acc[report.booking_id].photoFiles.push(report.file_path);
            }
            return acc;
        }, {});
        setGroupedReports(grouped);
    };

    const renderPagination = () => {
        const pageCount = Math.ceil(requests.length / itemsPerPage);
        const pages = [];
        for (let i = 1; i <= pageCount; i++) {
            pages.push(
                <button key={i} onClick={() => setCurrentPage(i)} disabled={i === currentPage}>
                    {i}
                </button>
            );
        }
        return <div className="pagination">{pages}</div>;
    };

    const toggleExpandReport = (id) => {
        setExpandedReport(expandedReport === id ? null : id);
    };

    const currentRequests = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="container">
            <div className="header">
                <img src="/images/header-image.jpg" alt="Header" className="header-image" />  
            </div>
            <h1>Booking Requests</h1>
            <button onClick={handleLogout}>Logout</button>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Auditorium Name</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRequests.map(request => (
                            <tr key={request.id}>
                                <td>{request.id}</td>
                                <td>{request.email}</td>
                                <td>{request.auditorium_name}</td>
                                <td>{formatAsIST(request.start_time)}</td>
                                <td>{formatAsIST(request.end_time)}</td>
                                <td>
                                    <button onClick={() => { setModalContent(parseFormContent(request.form_content)); setShowModal(true); }}>View Details</button>
                                    {request.status === 'Admin approval pending' && (
                                        <>
                                            <button onClick={() => updateStatus(request.id, 'Principal approval pending')}>Approve</button>
                                            <button onClick={() => {
                                                const reason = prompt('Please enter a reason for denial:');
                                                if (reason) updateStatus(request.id, 'Denied', reason);
                                            }}>Deny</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {renderPagination()}
            </div>
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setShowModal(false)}>&times;</span>
                        {modalContent}
                    </div>
                </div>
            )}
            <h2>Uploaded Reports and Photos</h2>
            <button onClick={() => setShowReportModal(true)}>View Uploaded Reports and Photos</button>
            {showReportModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setShowReportModal(false)}>&times;</span>
                        {Object.entries(groupedReports).map(([bookingId, files]) => (
                            <div key={bookingId} className="report-card">
                                <div className="report-card-header" onClick={() => toggleExpandReport(bookingId)}>
                                    <h3>Booking ID: {bookingId}</h3>
                                </div>
                                <div className={`report-card-body ${expandedReport === bookingId ? 'expanded' : ''}`}>
                                    <div>
                                        <strong>Reports:</strong>
                                        {files.reportFiles.map((file, index) => (
                                            <a key={index} className="report-link" href={`http://localhost:5000/api/download/${file.split('/').pop()}`} download>Download Report {index + 1}</a>
                                        ))}
                                    </div>
                                    <div>
                                        <strong>Photos:</strong>
                                        {files.photoFiles.map((file, index) => (
                                            <a key={index} className="photo-link" href={`http://localhost:5000/api/download/${file.split('/').pop()}`} download>Download Photo {index + 1}</a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="admin-actions">
                <form onSubmit={handleCreateAdmin}>
                    <h2>Create New Admin</h2>
                    <label>Email:</label>
                    <input type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="Enter email" required />
                    <label>Password:</label>
                    <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="Enter password" required />
                    <button type="submit">Create Admin</button>
                    {error && <p className="error-message">{error}</p>}
                </form>

                <form onSubmit={handleResetPassword}>
                    <h2>Reset Admin Password</h2>
                    <label>Admin Email:</label>
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Admin email" required />
                    <label>New Password:</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" required />
                    <button type="submit">Reset Password</button>
                </form>
            </div>
            <div className="form-editor">
                <h2>Create and Edit Form</h2>
                {config.map((field, index) => (
                    <div key={index} className="field-container">
                        <label>Field Label:</label>
                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                            placeholder="Field Label"
                        />
                        <label>Field Type:</label>
                        <select
                            value={field.type}
                            onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        >
                            <option value="text">Text</option>
                            <option value="dropdown">Dropdown</option>
                        </select>
                        {field.type === 'dropdown' && (
                            <>
                                <label>Options:</label>
                                <input
                                    type="text"
                                    value={field.options.join(', ')}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder="Enter options separated by commas"
                                />
                            </>
                        )}
                        <FaTrash
                            className="delete-icon"
                            onClick={() => handleDeleteField(index)}
                        />
                    </div>
                ))}
                <div className="buttons-container">
                    <button onClick={handleAddField}>Add Field</button>
                    <button onClick={handleSaveConfig}>Save Configuration</button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
