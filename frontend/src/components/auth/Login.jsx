import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth-service.js';
import authUtils from '../../utils/auth.js';

function Login() {
    const [formData, setData] = useState({
        username: '',
        pass: ''
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

        try {
            const response = await authService.login(formData);
            const { token, user } = response.data;

            authUtils.login(token, user);
            navigate('/dashboard');
        } catch (error) {
            setError(error.response?.data?.error || 'Login Failed');
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
                <h2>Login</h2>

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

                <button type = "submit" disabled = {loading} className = "btn btn-primary">
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <p className = "forgotPassword">
                    <Link to = '/forgot-password'>Forgot your password?</Link>
                </p>

                <p className = "authLink">
                    Don't have an account? <Link to = "/register">Register</Link>
                </p>
            </form>
        </div>
    )
}

export default Login;