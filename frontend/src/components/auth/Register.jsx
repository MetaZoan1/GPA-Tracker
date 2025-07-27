import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth-service.js';
import authUtils from '../../utils/auth.js';

function Register() {
    const [formData, setData] = useState({
        username: '',
        email: '',
        pass: '',
        confirmPass: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    function handleChange(e) {
        setData({...formData, [e.target.name]: e.target.value});
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.pass !== formData.confirmPass) {
            setError('Passwords do not match!');
            setLoading(false); // FIX: This was set to true, causing the form to stay disabled
            return;
        }

        try {
            await authService.register({
                username: formData.username,
                email: formData.email,
                pass: formData.pass
            });

            const loginResponse = await authService.login({
                username: formData.username,
                pass: formData.pass
            });

            const { token, user } = loginResponse.data;
            authUtils.login(token, user);
            navigate('/dashboard'); 
        } catch (error) {
            setError(error.response?.data?.error || 'Registration Failed');
        } finally {
            setLoading(false);
        }
    }

    if (authUtils.isAuthenticated()) { //already logged in
        navigate('/dashboard');
        return null;
    }

    return (
        <div className = "auth">
            <form onSubmit = {handleSubmit} className = "authForm">
                <h2>Register</h2>

                {error && <div className = "errorMessage">{error}</div>}

                <div className = "formField">
                    <label>Username:</label>
                    <input 
                        type = "text"
                        name = "username"
                        value = {formData.username}
                        onChange = {handleChange}
                        required
                        disabled = {loading}
                    />
                </div>

                <div className = "formField">
                    <label>Email:</label>
                    <input 
                        type = "email"
                        name = "email"
                        value = {formData.email}
                        onChange = {handleChange}
                        required
                        disabled = {loading}
                    />
                </div>

                <div className = "formField">
                    <label>Password:</label>
                    <input 
                        type = "password"
                        name = "pass"
                        value = {formData.pass}
                        onChange = {handleChange}
                        required
                        disabled = {loading}
                    />
                </div>

                <div className = "formField">
                    <label>Confirm Password:</label>
                    <input 
                        type = "password"
                        name = "confirmPass"
                        value = {formData.confirmPass}
                        onChange = {handleChange}
                        required
                        disabled = {loading}
                    />
                </div>

                <button type = "submit" disabled = {loading} className = "btn btn-primary">
                    {loading ? 'Registering...' : 'Register'}
                </button>

                <p className = "authLink">
                    Already have an account? <Link to = "/login">Login</Link>
                </p>
            </form>
        </div>
    )
}

export default Register;