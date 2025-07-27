import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header.jsx'
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import PrivateRoute from './components/layout/PrivateRoute.jsx';
import Footer from './components/layout/Footer.jsx';
import ResetPassword from './components/auth/ResetPassword.jsx';
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import './newApp.css';

function App() {
  return (
    <BrowserRouter>
      <div className = "App">
        <Header />
        <div className = "container">
          <Routes>
            <Route path = '/login' element = {<Login />} />
            <Route path = '/register' element = {<Register />} />
            <Route path = '/forgot-password' element = {<ForgotPassword />} />
            <Route path = '/reset-password' element = {<ResetPassword />} />
            <Route 
              path = '/dashboard'
              element = {
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path = '/' element = {<Navigate to = '/dashboard' />} />
          </Routes>
        </div>
        <Footer/>
      </div>
    </BrowserRouter>
  )
}

export default App;