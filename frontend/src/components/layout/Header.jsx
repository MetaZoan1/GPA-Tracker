import { Link, useNavigate } from 'react-router-dom';
import authUtils from '../../utils/auth.js';

function Header() {
    const navigate = useNavigate();
    const isAuthenticated = authUtils.isAuthenticated();
    const user = authUtils.getCurrentUser();

    function handleLogout() {
        authUtils.logout();
        navigate('/login');
    }

    return (
        <header className = "header">
            <div className = "headerContainer">
                <Link to = '/dashboard' className = "logo">
                    GPA Tracker
                </Link>

                <nav className = "nav">
                    {/*vvv a conditional vvv */}
                    {isAuthenticated ? (
                        <div className = "navElems">
                            <span className = "welcomeMessage">
                                Welcome, {user?.username}!
                            </span>
                            <button onClick = {handleLogout} className = "btn btn-outline">
                                Logout
                            </button>
                        </div>
                    ) : ( 
                        <div className = "navElems">
                            <Link to = '/login' className = "btn btn-outline">
                                Login
                            </Link>
                            <Link to = '/register' className = "btn btn-primary">
                                Register
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    )
}

export default Header;