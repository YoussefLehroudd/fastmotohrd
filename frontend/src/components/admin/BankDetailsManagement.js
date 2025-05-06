import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';

const BankDetailsManagement = () => {
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    beneficiary: '',
    whatsappNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/bank-details', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch bank details');
      
      const data = await response.json();
      if (data) {
        setBankDetails({
          bankName: data.bank_name || '',
          accountNumber: data.account_number || '',
          beneficiary: data.beneficiary || '',
          whatsappNumber: data.whatsapp_number || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:5000/api/admin/bank-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          beneficiary: bankDetails.beneficiary,
          whatsappNumber: bankDetails.whatsappNumber
        })
      });

      if (!response.ok) throw new Error('Failed to update bank details');
      
      const data = await response.json();
      setSuccess(data.message);
      setIsEditing(false); // Disable editing mode
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    setBankDetails({
      ...bankDetails,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Bank Account Details
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            {!isEditing ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Details
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setIsEditing(false);
                  fetchBankDetails(); // Reset to original values
                }}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
            )}
          </Box>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Bank Name"
              name="bankName"
              value={bankDetails.bankName}
              onChange={handleChange}
              margin="normal"
              required
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Account Number"
              name="accountNumber"
              value={bankDetails.accountNumber}
              onChange={handleChange}
              margin="normal"
              required
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="Beneficiary Name"
              name="beneficiary"
              value={bankDetails.beneficiary}
              onChange={handleChange}
              margin="normal"
              required
              disabled={!isEditing}
            />
            <TextField
              fullWidth
              label="WhatsApp Number"
              name="whatsappNumber"
              value={bankDetails.whatsappNumber}
              onChange={handleChange}
              margin="normal"
              required
              disabled={!isEditing}
              helperText="Include country code (e.g., +212600000000)"
            />
            {isEditing && (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Save Changes
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BankDetailsManagement;
