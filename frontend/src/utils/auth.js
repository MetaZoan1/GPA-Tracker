function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token; //returns a boolean (notted twice)
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null; // ? is the ternary operator here:
    // condition ? valueReturnedIfTrue : valueReturnedIfFalse
}

function getToken() {
    return localStorage.getItem('token');
}

function login(token, userData) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

export const authUtils = {
    isAuthenticated,
    getCurrentUser,
    getToken,
    login,
    logout
};

export default authUtils;