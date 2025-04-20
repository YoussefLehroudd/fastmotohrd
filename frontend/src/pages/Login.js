import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import loginBg from '../assets/images/signup-bg.jpg';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const { login } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  });
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const startCountdown = () => {
    setCountdown(60); // Start 60 second countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First try regular login to establish session
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      }, {
        withCredentials: true
      });

      if (loginResponse.data.requiresOTP) {
        setFormData(prev => ({
          ...prev,
          otp: '' // Clear the OTP input
        }));
        setSuccess('New OTP sent to your email. Please check both your inbox and spam folder.');
        startCountdown();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP';
      setError(errorMessage);
      
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    async function sendBrowserInfo() {
      try {
        const browser = navigator.userAgentData?.brands?.map(b => b.brand).join(', ') || navigator.userAgent;
        const userAgent = navigator.userAgent;
        await fetch('/api/tracking/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ browser, userAgent }),
          credentials: 'include'
        });
      } catch (error) {
        console.error('Failed to send browser info:', error);
      }
    }

    try {
      if (!showOTPInput) {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: formData.email,
          password: formData.password
        }, {
          withCredentials: true
        });

        if (response.data.requiresOTP) {
          setShowOTPInput(true);
          setSuccess('OTP sent to your email. Please check both your inbox and spam folder.');
          startCountdown();
          return;
        }
      } else {
        const response = await axios.post('http://localhost:5000/api/auth/verify-otp', {
          email: formData.email,
          otp: formData.otp
        }, {
          withCredentials: true
        });

        // Send browser info on successful login
        await sendBrowserInfo();

        // Redirect based on role
        // Store user data in context
        login(response.data.user);

        //
        if (response.data.user.role === 'admin') {
          navigate('/admin');
        } else if (response.data.user.role === 'seller') {
          navigate('/seller');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred during login';
      setError(errorMessage);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={6} 
          sx={{ 
            p: 4,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            align="center" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: '#1a237e',
              textTransform: 'uppercase',
              letterSpacing: 1,
              mb: 3
            }}
          >
            Welcome Back
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  fontSize: '1rem'
                }
              }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert 
              severity="success"
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  fontSize: '1rem'
                }
              }}
            >
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1a237e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1a237e',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1a237e',
                }
              }}
              inputProps={{
                autoComplete: 'new-email',
                form: {
                  autoComplete: 'off'
                }
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#1a237e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1a237e',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#1a237e',
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {showOTPInput && (
              <>
                <TextField
                fullWidth
                label="Enter OTP"
                name="otp"
                type="text"
                value={formData.otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setFormData(prev => ({
                    ...prev,
                    otp: value
                  }));
                }}
                margin="normal"
                required
                variant="outlined"
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]*',
                  inputMode: 'numeric'
                }}
                helperText="Please enter the 6-digit OTP code"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#1a237e',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1a237e',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#1a237e',
                  }
                }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Button
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || loading}
                    sx={{
                      color: countdown > 0 ? '#666' : '#1a237e',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </Button>
                </Box>
              </>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                backgroundColor: '#1a237e',
                '&:hover': {
                  backgroundColor: '#0d47a1'
                },
                fontSize: '1.1rem',
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              {loading ? 'Processing...' : (showOTPInput ? 'Verify OTP' : 'Login')}
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
                OR
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <Box>
              <GoogleSignInButton
                mode="login"
                onSuccess={(data) => {
                  login(data.user);
                  if (data.user.role === 'admin') {
                    navigate('/admin');
                  } else if (data.user.role === 'seller') {
                    navigate('/seller');
                  } else {
                    navigate('/home');
                  }
                }}
                onError={(message) => {
                  setError(message);
                  setTimeout(() => setError(''), 3000);
                }}
              />
            </Box>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  '& a': {
                    color: '#1a237e',
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }
                }}
              >
                Don't have an account? <a href="/signup">Sign up</a>
                <br />
                Forgot your password? <a href="/forgot-password">Reset it here</a>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
