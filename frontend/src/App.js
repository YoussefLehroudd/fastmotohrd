import React from 'react';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

export default App;
