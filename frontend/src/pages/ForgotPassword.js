import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: ''
  });
  const [step, setStep] = useState('email'); // email -> otp -> newPassword
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (step === 'email') {
        await axios.post('http://localhost:5000/api/auth/forgot-password', {
          email: formData.email
        });
        
        setStep('otp');
        setSuccess('OTP sent to your email. Please check both your inbox and spam folder.');
        setError('');
      } 
      else if (step === 'otp') {
        await axios.post('http://localhost:5000/api/auth/verify-reset-otp', {
          email: formData.email,
          otp: formData.otp
        });
        
        setStep('newPassword');
        setSuccess('OTP verified successfully');
        setError('');
        // Clear success message after 1 second
        setTimeout(() => {
          setSuccess('');
        }, 2000);
      }
      else if (step === 'newPassword') {
        await axios.post('http://localhost:5000/api/auth/reset-password', {
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        });

        setSuccess('Password reset successful!');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      let errorMessage;
      if (step === 'email') {
        errorMessage = err.response?.data?.message || 'Failed to send OTP. Please check your email and try again.';
      } else if (step === 'otp') {
        errorMessage = err.response?.data?.message || 'Invalid OTP. Please try again.';
      } else {
        errorMessage = err.response?.data?.message || 'Failed to reset password. Please try again.';
      }
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
            Reset Password
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
            {step === 'email' && (
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
              />
            )}
            
            {step === 'otp' && (
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
            )}

            {step === 'newPassword' && (
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                margin="normal"
                required
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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
              {loading ? 'Processing...' : (
                step === 'email' ? 'Send OTP' :
                step === 'otp' ? 'Verify OTP' :
                'Reset Password'
              )}
            </Button>

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
                Remember your password? <a href="/login">Login</a>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
