import { Navigate } from 'react-router-dom';
import authUtils from '../../utils/auth.js';

function PrivateRoute({children}) {
    return authUtils.isAuthenticated() ? children : <Navigate to='/login' />;
}

export default PrivateRoute;