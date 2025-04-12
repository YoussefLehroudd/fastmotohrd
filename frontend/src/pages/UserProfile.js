import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { 
  Edit as EditIcon, 
  CloudUpload as CloudUploadIcon, 
  Phone as PhoneIcon,
  DirectionsBike as BikeIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import GoogleSignInButton from '../components/GoogleSignInButton';
import UserBookings from '../components/UserBookings';
import MenuItem from '@mui/material/MenuItem';
import Navbar from '../components/Navbar';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'profile';
  });
  const [profile, setProfile] = useState(null);
  const [countries, setCountries] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+212',
    address: '',
    imageUrl: '',
    imageFile: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email change states
  const [emailChangeData, setEmailChangeData] = useState({
    currentPassword: '',
    newEmail: '',
    otp: ''
  });

  // Password change states
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchCountries = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/countries');
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      const data = await response.json();
      setCountries(data);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Failed to load countries');
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        countryCode: data.countryCode || '+212',
        address: data.address || '',
        imageUrl: data.profileImageUrl || '',
        imageFile: null
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    }
  }, []);


  const handleUnlinkGoogle = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/unlink-google', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess('Google account unlinked successfully');
        // Refresh the page after successful unlinking
        window.location.reload();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to unlink Google account');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCountries();
  }, [fetchProfile, fetchCountries]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleEmailChange = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!validateEmail(emailChangeData.newEmail)) {
        throw new Error('Please enter a valid email address');
      }

      if (emailChangeData.newEmail === formData.email) {
        throw new Error('New email must be different from current email');
      }
      
      const response = await fetch('http://localhost:5000/api/users/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: emailChangeData.currentPassword,
          newEmail: emailChangeData.newEmail
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate email change');
      }

      if (data.requiresOTP) {
        setShowEmailDialog(false);
        setShowOTPDialog(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5000/api/users/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          newEmail: emailChangeData.newEmail,
          otp: emailChangeData.otp
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      setShowOTPDialog(false);
      setSuccess('Email updated successfully');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const handlePasswordChange = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!validatePassword(passwordChangeData.newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers');
      }

      if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      const response = await fetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordChangeData.currentPassword,
          newPassword: passwordChangeData.newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setShowPasswordDialog(false);
      setSuccess('Password updated successfully');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      const fieldsToUpdate = {
        name: formData.name,
        phone: formData.phone,
        countryCode: formData.countryCode,
        address: formData.address
      };

      Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value);
        }
      });

      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PATCH',
        credentials: 'include',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setFormData({
        name: updatedProfile.username || '',
        email: updatedProfile.email || '',
        phone: updatedProfile.phone || '',
        countryCode: updatedProfile.countryCode || '+212',
        address: updatedProfile.address || '',
        imageUrl: updatedProfile.profileImageUrl || '',
        imageFile: null
      });
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailDialog = () => (
    <Dialog open={showEmailDialog} onClose={() => setShowEmailDialog(false)}>
      <DialogTitle>Change Email</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Current Password"
          type="password"
          fullWidth
          value={emailChangeData.currentPassword}
          onChange={(e) => setEmailChangeData(prev => ({ ...prev, currentPassword: e.target.value }))}
        />
        <TextField
          margin="dense"
          label="New Email"
          type="email"
          fullWidth
          value={emailChangeData.newEmail}
          onChange={(e) => {
            const newEmail = e.target.value;
            setEmailChangeData(prev => ({ ...prev, newEmail }));
          }}
          error={Boolean(emailChangeData.newEmail && (emailChangeData.newEmail === formData.email || !validateEmail(emailChangeData.newEmail)))}
          helperText={
            emailChangeData.newEmail
              ? emailChangeData.newEmail === formData.email
                ? 'New email must be different from current email'
                : !validateEmail(emailChangeData.newEmail)
                  ? 'Please enter a valid email address'
                  : '✓ Valid email'
              : 'Enter new email address'
          }
          FormHelperTextProps={{
            sx: {
              color: emailChangeData.newEmail && validateEmail(emailChangeData.newEmail) && emailChangeData.newEmail !== formData.email
                ? 'success.main'
                : undefined
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowEmailDialog(false)}>Cancel</Button>
        <Button 
          onClick={handleEmailChange} 
          disabled={
            isLoading || 
            !emailChangeData.currentPassword || 
            !emailChangeData.newEmail || 
            emailChangeData.newEmail === formData.email || 
            !validateEmail(emailChangeData.newEmail)
          }
        >
          {isLoading ? <CircularProgress size={24} /> : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderOTPDialog = () => (
    <Dialog open={showOTPDialog} onClose={() => setShowOTPDialog(false)}>
      <DialogTitle>Verify Email Change</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Please enter the OTP sent to {emailChangeData.newEmail}
        </Typography>
        <TextField
          margin="dense"
          label="Enter OTP"
          fullWidth
          value={emailChangeData.otp}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
            setEmailChangeData(prev => ({
              ...prev,
              otp: value
            }));
          }}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowOTPDialog(false)}>Cancel</Button>
        <Button onClick={handleVerifyEmailOTP} disabled={isLoading || !emailChangeData.otp}>
          {isLoading ? <CircularProgress size={24} /> : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderPasswordDialog = () => (
    <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Current Password"
          type="password"
          fullWidth
          value={passwordChangeData.currentPassword}
          onChange={(e) => setPasswordChangeData(prev => ({ ...prev, currentPassword: e.target.value }))}
        />
        <TextField
          margin="dense"
          label="New Password"
          type="password"
          fullWidth
          value={passwordChangeData.newPassword}
          onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
          error={Boolean(passwordChangeData.newPassword && (!validatePassword(passwordChangeData.newPassword) || passwordChangeData.newPassword !== passwordChangeData.confirmPassword))}
          helperText={
            passwordChangeData.newPassword
              ? !validatePassword(passwordChangeData.newPassword)
                ? "Password must be at least 8 characters with uppercase, lowercase, and numbers"
                : passwordChangeData.newPassword !== passwordChangeData.confirmPassword
                  ? "Passwords do not match"
                  : "✓ Password meets requirements"
              : "Must be at least 8 characters with uppercase, lowercase, and numbers"
          }
          FormHelperTextProps={{
            sx: {
              color: passwordChangeData.newPassword && validatePassword(passwordChangeData.newPassword) && 
                     passwordChangeData.newPassword === passwordChangeData.confirmPassword ? 'success.main' : undefined
            }
          }}
        />
        <TextField
          margin="dense"
          label="Confirm New Password"
          type="password"
          fullWidth
          value={passwordChangeData.confirmPassword}
          onChange={(e) => setPasswordChangeData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          error={Boolean(passwordChangeData.confirmPassword && passwordChangeData.newPassword !== passwordChangeData.confirmPassword)}
          helperText={
            passwordChangeData.confirmPassword 
              ? passwordChangeData.newPassword !== passwordChangeData.confirmPassword
                ? "Passwords do not match"
                : "✓ Passwords match"
              : ""
          }
          FormHelperTextProps={{
            sx: {
              color: passwordChangeData.confirmPassword && 
                     passwordChangeData.newPassword === passwordChangeData.confirmPassword 
                     ? 'success.main' : undefined
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
        <Button 
          onClick={handlePasswordChange} 
          disabled={
            isLoading || 
            !passwordChangeData.currentPassword || 
            !passwordChangeData.newPassword || 
            !passwordChangeData.confirmPassword || 
            !validatePassword(passwordChangeData.newPassword) ||
            passwordChangeData.newPassword !== passwordChangeData.confirmPassword
          }
        >
          {isLoading ? <CircularProgress size={24} /> : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (!profile && !error) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Grid container>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  startIcon={<PersonIcon />}
                  onClick={() => {
                    setActiveTab('profile');
                    window.history.replaceState(null, '', '/profile');
                  }}
                  sx={{
                    py: 2,
                    borderRadius: 0,
                    borderBottom: activeTab === 'profile' ? 2 : 0,
                    borderColor: 'primary.main',
                    color: activeTab === 'profile' ? 'primary.main' : 'text.primary'
                  }}
                >
                  Profile
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  startIcon={<BikeIcon />}
                  onClick={() => {
                    setActiveTab('bookings');
                    window.history.replaceState(null, '', '/profile?tab=bookings');
                  }}
                  sx={{
                    py: 2,
                    borderRadius: 0,
                    borderBottom: activeTab === 'bookings' ? 2 : 0,
                    borderColor: 'primary.main',
                    color: activeTab === 'bookings' ? 'primary.main' : 'text.primary'
                  }}
                >
                  My Bookings
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  startIcon={<SecurityIcon />}
                  onClick={() => {
                    setActiveTab('security');
                    window.history.replaceState(null, '', '/profile?tab=security');
                  }}
                  sx={{
                    py: 2,
                    borderRadius: 0,
                    borderBottom: activeTab === 'security' ? 2 : 0,
                    borderColor: 'primary.main',
                    color: activeTab === 'security' ? 'primary.main' : 'text.primary'
                  }}
                >
                  Security
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                whiteSpace: 'pre-wrap',
                fontWeight: error.includes('Configuration Error') ? 500 : 400
              }
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {activeTab === 'profile' && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h1">
                My Profile
              </Typography>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(!isEditing)}
                color="primary"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={
                        formData.imageFile 
                          ? URL.createObjectURL(formData.imageFile)
                          : formData.imageUrl 
                            ? `http://localhost:5000${formData.imageUrl}`
                            : undefined
                      }
                      sx={{ width: 120, height: 120 }}
                    />
                    {isEditing && (
                      <>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="profile-image"
                          type="file"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              const file = e.target.files[0];
                              if (file.size > 5 * 1024 * 1024) {
                                setError('Image size must be less than 5MB');
                                return;
                              }
                              setFormData(prev => ({
                                ...prev,
                                imageFile: file
                              }));
                            }
                          }}
                        />
                        <label htmlFor="profile-image">
                          <Button
                            component="span"
                            startIcon={<CloudUploadIcon />}
                            sx={{ mt: 1 }}
                          >
                            Upload Photo
                          </Button>
                        </label>
                      </>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="name"
                    label="Name"
                    fullWidth
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="email"
                    label="Email"
                    fullWidth
                    value={formData.email}
                    disabled={true}
                    helperText="Use 'Change Email' button below to update email"
                    type="email"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      select
                      name="countryCode"
                      value={formData.countryCode || '+212'}
                      onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                      disabled={!isEditing}
                      sx={{ width: '180px' }}
                      SelectProps={{
                        renderValue: (value) => {
                          const country = countries.find(c => c.code === value);
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {country?.flag && /\p{Extended_Pictographic}/u.test(country.flag) ? (
                                <span role="img" aria-label={`Flag of ${country?.name}`} style={{ fontSize: '1.2em' }}>{country?.flag}</span>
                              ) : (
                                <img src={country?.flag_image} alt={`Flag of ${country?.name}`} style={{ width: '1.5em', height: '1em', objectFit: 'cover' }} />
                              )}
                              <span>{value}</span>
                            </Box>
                          );
                        }
                      }}
                    >
                      {Array.from(new Set(countries.map(c => c.code)))
                        .sort((a, b) => {
                          const numA = a.replace(/\D/g, '');
                          const numB = b.replace(/\D/g, '');
                          if (numA.length !== numB.length) {
                            return numA.length - numB.length;
                          }
                          return parseInt(numA) - parseInt(numB);
                        })
                        .map(code => {
                          const country = countries.find(c => c.code === code);
                          return (
                            <MenuItem key={country.id} value={code} sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {country.flag && /\p{Extended_Pictographic}/u.test(country.flag) ? (
                                <span role="img" aria-label={`Flag of ${country.name}`} style={{ fontSize: '1.2em' }}>{country.flag}</span>
                              ) : (
                                <img src={country.flag_image} alt={`Flag of ${country.name}`} style={{ width: '1.5em', height: '1em', objectFit: 'cover' }} />
                              )}
                              <span>{code}</span>
                            </MenuItem>
                          );
                        })}
                    </TextField>
                    {isEditing ? (
                      <TextField
                        name="phone"
                        label="Phone Number"
                        fullWidth
                        value={formData.phone || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.startsWith('0')) {
                            value = value.substring(1);
                          }
                          if (value.length <= 9) {
                            setFormData(prev => ({ ...prev, phone: value }));
                          }
                        }}
                        disabled={!isEditing}
                        inputProps={{ 
                          pattern: '[0-9]*',
                          inputMode: 'numeric',
                          maxLength: 10
                        }}
                        helperText="Enter 9 digits (excluding leading 0)"
                        InputProps={{
                          startAdornment: (
                            <PhoneIcon sx={{ color: 'action.active', mr: 1 }} />
                          ),
                        }}
                      />
                    ) : (
                      <TextField
                        name="phone"
                        label="Phone Number"
                        fullWidth
                        value={formData.countryCode + ' ' + (formData.phone || '')}
                        disabled={true}
                        InputProps={{
                          startAdornment: (
                            <PhoneIcon sx={{ color: 'action.active', mr: 1 }} />
                          ),
                        }}
                      />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="address"
                    label="Address"
                    fullWidth
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </Grid>

                {isEditing && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : null}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </form>
          </Paper>
        )}

        {activeTab === 'bookings' && <UserBookings />}

        {activeTab === 'security' && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Security Settings</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={() => setShowEmailDialog(true)}
                >
                  Change Email
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            {/* <Typography variant="h6" sx={{ mb: 3 }}>Social Logins</Typography> */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                  <GoogleIcon color={profile?.googleEmail ? "primary" : "disabled"} />
                  <Box>
                    {/* <Typography>Google Account</Typography> */}
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {profile?.googleEmail ? profile.googleEmail : 'Disabled'}
                    </Typography>
                  </Box>
                </Box>
                <GoogleSignInButton
                  isLinked={Boolean(profile?.googleEmail)}
                  onSuccess={async (credential) => {
                    try {
                      const res = await fetch('http://localhost:5000/api/users/link-google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ token: credential })
                      });
                      
                      const data = await res.json();
                      if (res.ok) {
                        setSuccess('Google account linked successfully');
                        window.location.reload();
                      } else {
                        setError(data.message);
                      }
                    } catch (error) {
                      setError('Failed to link Google account');
                    }
                  }}
                  onError={(message) => setError(message)}
                  onUnlink={handleUnlinkGoogle}
                />
              </Box>
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              *If you disable social logins, you'll still be able to login using your username and password
            </Typography>
          </Paper>
        )}
      </Container>
      {renderEmailDialog()}
      {renderOTPDialog()}
      {renderPasswordDialog()}
    </>
  );
};

export default UserProfile;
