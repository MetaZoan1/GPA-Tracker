import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth-service.js';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    function handleChange(e) {
        setEmail(e.target.value);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await authService.forgotPassword(email);
            setMessage('Password reset instructions sent to your email');
        } catch (error) {
            setError(error?.response?.data?.error || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className = "auth">
            <form onSubmit = {handleSubmit} className = "authForm">
                <h2>Forgot Password</h2>
                <p className = "forgotPasswordText">
                    Enter your email and we'll send you instructions to reset your password.
                </p>

                {error && <div className = "errorMessage">{error}</div>}
                {message && <div className = "resetMessage">{message}</div>}

                <div className = "formField">
                    <label>Email:</label>
                    <input
                        type = "email"
                        value = {email}
                        onChange = {handleChange}
                        placeholder = "Please Enter your email"
                        required
                        disabled = {loading}
                    />
                </div>

                <button type = "submit" disabled = {loading} className = "btn btn-primary">
                    {loading ? 'Sending...' : 'Send Reset Request'}
                </button>

                <p className = "authLink">
                    Remember your password? <Link to = '/login'>Login</Link>
                </p>
            </form>
        </div>
    )
}

export default ForgotPassword;