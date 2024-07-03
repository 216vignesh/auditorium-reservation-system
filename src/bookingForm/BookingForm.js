import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../css/BookingForm.css';
import queryString from 'query-string';

const BookingForm = ({ auditoriums }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [bookingDetails, setBookingDetails] = useState({});
    const [formConfig, setFormConfig] = useState([]);
    const [formData, setFormData] = useState({});
    const [verificationStep, setVerificationStep] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [verificationMessage, setVerificationMessage] = useState('');

    useEffect(() => {
        const params = queryString.parse(location.search);
        setBookingDetails(params);
        fetch('http://localhost:5000/api/get-form-config')
            .then(res => res.json())
            .then(data => {
                console.log("Form Configuration:", data.config);
                setFormConfig(data.config || []);
                const initialFormData = data.config.reduce((acc, field) => {
                    if (!field.name) {
                        console.error('Missing field name:', field);
                    }
                    acc[field.name] = '';
                    return acc;
                }, {});
                console.log("Initial Form Data:", initialFormData);
                setFormData(initialFormData);
            })
            .catch(err => console.error('Error fetching form config:', err));
    }, [location]);

    const handleChange = (fieldName, value) => {
        console.log(`Field to update: ${fieldName}, Value: ${value}`);
        setFormData(prevFormData => {
            const newFormData = { ...prevFormData, [fieldName]: value };
            console.log('Updated FormData:', newFormData);
            return newFormData;
        });
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!email.endsWith('@gmail.com')) {
            alert('Please enter a valid Gmail address.');
            return;
        }

        if (!verificationStep) {
            fetch('http://localhost:5000/api/send-verification-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.verificationCode) {
                        setGeneratedCode(data.verificationCode);
                        setVerificationStep(true);
                        setVerificationMessage('Verification code sent to your email. Please enter the code below.');
                    } else {
                        throw new Error(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error sending verification code:', error);
                    alert('Failed to send verification code: ' + error.message);
                });
        } else {
            if (verificationCode === generatedCode) {
                const bookingData = {
                    auditorium_id: bookingDetails.auditorium_id,
                    auditorium_name: auditoriums.find(a => a.value === bookingDetails.auditorium_id)?.label,
                    start_time: bookingDetails.start_time,
                    end_time: bookingDetails.end_time,
                    email: email,
                    form_content: JSON.stringify(formData)
                };

                console.log(bookingData);

                fetch('http://localhost:5000/api/book-auditorium', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        alert(data.message);
                        navigate('/');
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Failed to book the auditorium: ' + error.message);
                    });
            } else {
                alert('Invalid verification code.');
            }
        }
    };

    return (
        <div className="container">
            <div className="header">
                <img src="/images/header-image.jpg" alt="Header" className="header-image" />  
            </div>
            <form onSubmit={handleSubmit}>
                <h1>Booking Form</h1>
                <p>Auditorium: {auditoriums.find(a => a.value === bookingDetails.auditorium_id)?.label}</p>
                <p>From: {bookingDetails.start_time}</p>
                <p>To: {bookingDetails.end_time}</p>
                <div className="field-container">
                    <label>Email:</label>
                    <input type="email" value={email} onChange={handleEmailChange} required />
                </div>
                {formConfig.map((field, index) => (
                    <div key={index} className="field-container">
                        <label>{field.label}</label>
                        {field.type === 'text' && (
                            <input
                                type="text"
                                value={formData[field.label] || ''}
                                onChange={(e) => handleChange(field.label, e.target.value)}
                            />
                        )}
                        {field.type === 'dropdown' && (
                            <select
                                value={formData[field.label] || ''}
                                onChange={(e) => handleChange(field.label, e.target.value)}
                            >
                                {field.options.map((option, idx) => (
                                    <option key={idx} value={option}>{option}</option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
                {verificationStep && (
                    <>
                        <p>{verificationMessage}</p>
                        <div className="field-container">
                            <label>Verification Code:</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                            />
                        </div>
                    </>
                )}
                <button type="submit">{verificationStep ? 'Verify and Submit' : 'Submit Booking'}</button>
            </form>
            <div className="form-footer">
                <Link to="/">Back to Home</Link>
            </div>
        </div>
    );
};

export default BookingForm;
