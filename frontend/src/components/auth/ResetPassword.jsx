import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth-service.js';

function ResetPassword() {
    const [formData, setData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const resetToken = searchParams.get('token');

    function handleChange(e) {
        setData({...formData, [e.target.name]: e.target.value});
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        setMessage('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Password does not match the confirm');
            setLoading(false);
            return;
        }

        if (!resetToken) {
            setError('Invalid reset token, request a new password reset');
            setLoading(false);
            return;
        }

        try {
            await authService.resetPassword(resetToken, formData.newPassword);
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 1000)
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to reset password')
        } finally {
            setLoading(false);
        }
    }

    if (!resetToken) {
        return (
            <div className = "auth">
                <div className = "authForm">
                    <h2>Invalid Reset Link</h2>
                    <p>This password reset link has expired or is invalid.</p>
                    <p className = "authLink">
                        <Link to = '/forgot-password'>Request a new reset link</Link>
                    </p>
                    <p className = "authLink">
                        <Link to = '/login'>Or go back to login</Link>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className = "auth">
            <form onSubmit = {handleSubmit} className = "authForm">
                <h2>Reset Password</h2>
                <p className = "resetPasswordText">Enter your new password</p>

                {error && <div className = "errorMessage">{error}</div>}
                {message && <div className = "resetMessage">{message}</div>}

                <div className = "formField">
                    <label>New Password:</label>
                    <input 
                        type = "password"
                        name = "newPassword"
                        value = {formData.newPassword}
                        onChange = {handleChange}
                        required
                        disabled = {loading}
                        minLength = "8"
                    />
                </div>

                <div className = "formField">
                    <label>Confirm Password:</label>
                    <input 
                        type = "password"
                        name = "confirmPassword"
                        value = {formData.confirmPassword}
                        onChange = {handleChange}
                        required
                        disabled = {loading}
                    />
                </div>

                <button type = "submit" disabled = {loading} className = "btn btn-primary">
                    {loading ? 'Resetting password...' : 'Reset Password'}
                </button>

                <p className = "authLink">
                    Remember your password? <Link to = '/login'>Login</Link>
                </p>
            </form>
        </div>
    )
}

export default ResetPassword;