import React, { useEffect } from 'react';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Seller from './pages/Seller';
import SellerProfile from './pages/SellerProfile';
import UserProfile from './pages/UserProfile';
import CreateBooking from './pages/CreateBooking';
import SellerOrders from './components/SellerOrders';
import SellerPayments from './components/SellerPayments';
import SellerReviews from './components/SellerReviews';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import MotorDetails from './pages/MotorDetails';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <UserProvider>
        <Router>
          <RouteTracker />
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/book/:motorId" element={
              <ProtectedRoute>
                <CreateBooking />
              </ProtectedRoute>
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/*" 
              element={
                <ProtectedRoute roles={['seller']}>
                  <Routes>
                    <Route path="/" element={<Seller />} />
                    <Route path="dashboard" element={<Seller />} />
                    <Route path="orders" element={<SellerOrders />} />
                    <Route path="payments" element={<SellerPayments />} />
                    <Route path="reviews" element={<SellerReviews />} />
                    <Route path="motors" element={<Seller />} />
                    <Route path="profile" element={<SellerProfile />} />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            <Route path="/home" element={<Home />} />
            <Route path="/motor/:id" element={<MotorDetails />} />
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-success" 
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute roles={['user']}>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Send browser info once on mount
    const sendBrowserInfo = async () => {
      try {
        const browser = navigator.userAgentData?.brands?.map(b => b.brand).join(', ') || navigator.userAgent;
        const userAgent = navigator.userAgent;
    await fetch('http://localhost:5000/api/tracking/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browser, userAgent }),
      credentials: 'include'
    });
      } catch (error) {
        console.error('Failed to send browser info:', error);
      }
    };

    sendBrowserInfo();
  }, []);

  useEffect(() => {
    // Send page view on route change
    const sendPageView = async () => {
      try {
    await fetch('http://localhost:5000/api/tracking/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: window.location.pathname }),
      credentials: 'include'
    });
      } catch (error) {
        console.error('Failed to send page view:', error);
      }
    };

    sendPageView();
  }, [location]);

  return null;
}

export default App;
