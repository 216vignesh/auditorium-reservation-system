import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReportUpload = () => {
    const [email, setEmail] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/fetch-bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, reportSubmitted: "No" })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setBookings(data.bookings);
        } catch (error) {
            alert("Failed to fetch bookings: " + error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleFileUpload = async (bookingId, formData) => {
        console.log(bookingId);
        try {
            const response = await fetch(`http://localhost:5000/api/upload-report/${bookingId}`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            alert('Report uploaded successfully');
            navigate('/');
        } catch (error) {
            alert("Failed to upload report: " + error.message);
        }
    };
    const handleSubmitReport = (event, bookingId) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        for (var pair of formData.entries()) {
            console.log(pair[0]+ ', ' + pair[1]); 
        }
        if (formData.has('reportFile') && formData.has('photoFile')) {
            handleFileUpload(bookingId, formData);
        } else {
            alert("Form data is incomplete. Please check your file inputs.");
        }
    };

    return (
        <div>
            <div className="header">
                <img src="/images/header-image.jpg" alt="Header" className="header-image" />  
            </div>
            <h1>Upload Event Report and Photos</h1>
            <form onSubmit={handleEmailSubmit}>
                <label>
                    Enter your email to fetch your bookings:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Fetching...' : 'Fetch Bookings'}
                </button>
            </form>

            {bookings.length > 0 && (
                <div>
                    <h2>Your Bookings</h2>
                    {bookings.map((booking) => (
                        <div key={booking.id}>
                            <h3>{booking.auditorium_name}</h3>
                            <p>Booking ID: {booking.id}</p>
                            <form onSubmit={(e) => handleSubmitReport(e, booking.id)}>
                                <input type="file" name="reportFile" required />
                                <input type="file" name="photoFile" multiple required />
                                <button type="submit">Upload Report</button>
                            </form>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReportUpload;
