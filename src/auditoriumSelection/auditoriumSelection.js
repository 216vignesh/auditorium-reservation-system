import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment-timezone';
import "react-datepicker/dist/react-datepicker.css";
import '../css/AuditoriumSelection.css';
import { useNavigate } from 'react-router-dom';

function formatAsIST(date) {
    return moment(date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
}

const AuditoriumSelection = ({ auditoriums, onBookingSubmit }) => {
    const [selectedAuditorium, setSelectedAuditorium] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [occupiedSlots, setOccupiedSlots] = useState([]);
    const navigate = useNavigate();

    const handleAuditoriumChange = (option) => {
        setSelectedAuditorium(option);
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    const fetchOccupiedSlots = () => {
        const formattedStartDate = moment().tz('Asia/Kolkata').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const formattedEndDate = moment().tz('Asia/Kolkata').add(7, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');

        fetch('http://localhost:5000/api/check-auditorium', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auditorium_id: selectedAuditorium ? selectedAuditorium.value : null,
                start_time: formattedStartDate,
                end_time: formattedEndDate
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Missing data") {
                console.error('Error fetching occupied slots: Missing data');
            } else {
                setOccupiedSlots(data.occupiedSlots || []);
                console.log('Occupied Slots Updated:', data.occupiedSlots);
            }
        })
        .catch(error => {
            console.error('Error fetching occupied slots:', error);
        });
    };

    useEffect(() => {
        fetchOccupiedSlots();
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!selectedAuditorium) {
            alert('Please select an auditorium.');
            return;
        }

        if (startDate >= endDate) {
            alert('Start time must be before end time.');
            return;
        }

        const formattedStartDate = formatAsIST(startDate);
        const formattedEndDate = formatAsIST(endDate);

        fetch('http://localhost:5000/api/check-auditorium', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auditorium_id: selectedAuditorium.value,
                start_time: formattedStartDate,
                end_time: formattedEndDate
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.available) {
                alert(data.message);
            } else {
                const bookingLink = `/book-form?auditorium_id=${selectedAuditorium.value}&start_time=${encodeURIComponent(formattedStartDate)}&end_time=${encodeURIComponent(formattedEndDate)}`;
                if (window.confirm("Selected auditorium available for booking. Click OK to proceed to Booking")) {
                    navigate(bookingLink);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to check auditorium availability: ' + error.message);
        });
    };

    return (
        <div className="container">
            <div className="header">
                <img src="/images/header-image.jpg" alt="Header" className="header-image" />
                <button onClick={handleLoginClick} className="header-button">Login</button>
            </div>
            <div className="left-panel">
                <h2>Select an Auditorium and Date/Time</h2>
                <form onSubmit={handleSubmit}>
                    <div className="select-container">
                        <Select
                            value={selectedAuditorium}
                            onChange={handleAuditoriumChange}
                            options={auditoriums}
                            getOptionLabel={option => option.label}
                            getOptionValue={option => option.value}
                            placeholder="Select an auditorium"
                        />
                    </div>
                    <div className="date-picker-container">
                        <div className="date-picker">
                            <h4>From:</h4>
                            <DatePicker
                                selected={startDate}
                                onChange={setStartDate}
                                showTimeSelect
                                filterTime={time => time.getHours() >= 7 && time.getHours() <= 22}
                                dateFormat="Pp"
                            />
                        </div>
                        <div className="date-picker">
                            <h4>To:</h4>
                            <DatePicker
                                selected={endDate}
                                onChange={setEndDate}
                                showTimeSelect
                                filterTime={time => time.getHours() >= 7 && time.getHours() <= 22}
                                dateFormat="Pp"
                            />
                        </div>
                    </div>
                    <div className="buttons-container">
                        <button type="submit">Check Availability</button>
                        <button onClick={() => navigate('/report-upload')}>Upload Report</button>
                    </div>
                </form>
            </div>
            <div className="right-panel">
                <h3>Occupied Slots:</h3>
                <ul>
                    {occupiedSlots.map((slot, index) => (
                        <li key={index}>
                            The auditorium {slot.auditorium_name} is occupied between {moment(slot.start).format('DD/MM/YYYY hh:mm A')} and {moment(slot.end).format('DD/MM/YYYY hh:mm A')}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AuditoriumSelection;
