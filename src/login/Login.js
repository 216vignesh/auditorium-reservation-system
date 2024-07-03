import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../css/Login.css'

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = (event) => {
        event.preventDefault();

        const loginUrl = 'http://localhost:5000/api/login';

        fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Login successful') {
                console.log('Login successful', data);
                login();
                // Redirect based on userType
                if (data.userType === 'Admin') {
                    navigate('/dashboard'); // Redirecting to admin dashboard
                } else if (data.userType === 'Principal') {
                    navigate('/principalDashboard'); // Redirecting to principal dashboard
                } else {
                    throw new Error('Unknown user type');
                }
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Login failed', error);
            setError(error.message || 'Invalid credentials or server error');
        });
    };

    return (
        <div className="container">
            <div className="header">
                <img src="/images/header-image.jpg" alt="Header" className="header-image" />  
            </div>
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <label>
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Password:
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit">Login</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default Login;
