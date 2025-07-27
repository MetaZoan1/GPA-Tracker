import api from "../api/api";

function register(userData) {
    return api.post('/register', userData);
}

function login(userCredentials) {
    return api.post('/login', userCredentials);
}

function forgotPassword(email) {
    return api.post('/forgot-password', { email });
}

function resetPassword(token, newPass) {
    return api.post('/reset-password', {
        token,
        newPass
    });
}

export const authService = {
    register,
    login,
    forgotPassword,
    resetPassword
};

export default authService;