import React from 'react';
import ReactDOM from 'react-dom';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuditoriumSelection from './auditoriumSelection/auditoriumSelection';
import BookingForm from './bookingForm/BookingForm'; // Assume you have this component
// import Header from './Header';
import { AuthProvider } from './AuthContext';
import Login from './login/Login'
import Dashboard from './login/adminDashboard';
import PrincipalDashboard from './login/principalDashboard'
import ReportUpload from './reportSelection/reportSelection'

const App = () => {
    const auditoriums = [
        { value: 'auditorium1', label: 'Seminar Hall' },
        { value: 'auditorium2', label: 'Dilip Kumar Auditorium' },
        { value: 'auditorium3', label: 'Seminar Hall 2' }
    ];


    return (
        <AuthProvider>
        <Router>        
                <Routes>
                    <Route path="/" element={<AuditoriumSelection auditoriums={auditoriums} />} />
                    <Route path="/book-form" element={<BookingForm auditoriums={auditoriums} />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path='/principalDashboard' element={<PrincipalDashboard/>} />
                    <Route path="/report-upload" element={<ReportUpload />} />
                </Routes>    
        </Router>
        </AuthProvider>
    );
}

export default App;