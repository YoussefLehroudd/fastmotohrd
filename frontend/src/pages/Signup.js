import React, { useState, useEffect } from 'react';
import signupBg from '../assets/images/signup-bg.jpg';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Default to regular user
    otp: ''
  });
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check email existence when email field changes
    if (name === 'email' && value) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/check-email', {
          email: value
        });
        
        if (response.data.exists) {
          setEmailError('This email is already registered');
        } else {
          setEmailError('');
        }
      } catch (err) {
        console.error('Error checking email:', err);
      }
    }
  };

  useEffect(() => {
    if (success === true) { // Only redirect on final registration success
      const timer = setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (emailError) {
      setError('Please use a different email address');
      return;
    }

    // Only validate passwords match on frontend
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
      
      return;
    }

    setLoading(true);
    try {
      if (!showOTPInput) {
        const response = await axios.post('http://localhost:5000/api/auth/signup', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });

        if (response.data.requiresOTP) {
          setShowOTPInput(true);
          setSuccess('OTP sent to your email. Please check both your inbox and spam folder.');
          return;
        }
      } else {
        const response = await axios.post('http://localhost:5000/api/auth/verify-signup-otp', {
          email: formData.email,
          otp: formData.otp
        });

        if (response.data.success) {
          setSuccess(true);
          setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'user',
            otp: ''
          });
          setShowOTPInput(false);
        }
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || '';
      setError(errorMessage); // Display the exact error message from backend
      
      // Clear error message after 3 seconds
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
        background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${signupBg})`,
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
            Join Our Motors Community
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
                py: typeof success === 'boolean' ? 3 : 2,
                '& .MuiAlert-message': {
                  fontSize: '1rem'
                }
              }}
            >
              {typeof success === 'string' ? success : (
                <>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Registration Successful! 🎉
                  </Typography>
                  <Typography sx={{ mb: 2 }}>
                    Redirecting to login page...
                  </Typography>
                </>
              )}
            </Alert>
          )}
          {(!success || showOTPInput) && (
            <form onSubmit={handleSubmit} autoComplete="off">
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
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
                autoComplete: 'new-username',
                form: {
                  autoComplete: 'off'
                }
              }}
            />
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
              error={!!emailError}
              helperText={emailError}
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
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
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
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
              <FormLabel 
                component="legend"
                sx={{
                  color: '#1a237e',
                  fontWeight: 500,
                  fontSize: '1rem'
                }}
              >
                Choose Your Role
              </FormLabel>
              <RadioGroup
                name="role"
                value={formData.role}
                onChange={handleChange}
                row
              >
                <FormControlLabel 
                  value="user" 
                  control={<Radio />} 
                  label="Regular User" 
                />
                <FormControlLabel 
                  value="seller" 
                  control={<Radio />} 
                  label="Seller" 
                />
              </RadioGroup>
            </FormControl>
            {showOTPInput && (
              <TextField
                fullWidth
                label="Enter OTP"
                name="otp"
                type="text"
                value={formData.otp}
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
              {loading ? 'Processing...' : (showOTPInput ? 'Verify OTP' : 'Create Account')}
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
                Already have an account? <a href="/login">Login</a>
              </Typography>
            </Box>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;
