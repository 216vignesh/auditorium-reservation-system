import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import '../css/PrincipalDashboard.css';

const PrincipalDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [reports, setReports] = useState([]);
    const [groupedReports, setGroupedReports] = useState({});
    const [denialReason, setDenialReason] = useState({});
    const [modalContent, setModalContent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);  // Add this state
    const [expandedReport, setExpandedReport] = useState(null);  // Add this state
    const itemsPerPage = 10;  // Add this constant
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/booking-requests-principal')
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

    const formatAsIST = (utcDateTime) => {
        return moment.utc(utcDateTime).tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm A');
    };

    const updateStatus = (id, newStatus, reason = '') => {
        fetch('http://localhost:5000/api/update-booking-status-principal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, newStatus, reason })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
                setDenialReason({ ...denialReason, [id]: '' });
            })
            .catch(err => console.error('Error updating status:', err));
    };

    const parseFormContent = (formContent) => {
        try {
            const content = JSON.parse(formContent);
            return (
                <div>
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key}>
                            <strong>{key}: </strong>{value}
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

    const currentRequests = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const toggleExpandReport = (id) => {
        setExpandedReport(expandedReport === id ? null : id);
    };

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
                                    {request.status === 'Principal approval pending' && (
                                        <>
                                            <button onClick={() => updateStatus(request.id, 'Active')}>Approve</button>
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
        </div>
    );
};

export default PrincipalDashboard;
