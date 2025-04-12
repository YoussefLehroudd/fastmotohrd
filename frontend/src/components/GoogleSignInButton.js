import React, { useEffect } from 'react';
import { Box, Button } from '@mui/material';

const GoogleSignInButton = ({ onSuccess, onError, isLinked, onUnlink, mode = 'link' }) => {
  useEffect(() => {
    if (isLinked) return;

    const initializeGoogleSignIn = () => {
      if (!window.google) return;

      try {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        if (!clientId) {
          throw new Error('Google Client ID not found in environment variables');
        }

        if (window.google?.accounts?.id) {
          window.google.accounts.id.cancel();
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              try {
                const endpoint = mode === 'login' 
                  ? 'http://localhost:5000/api/auth/google'
                  : 'http://localhost:5000/api/users/link-google';

                const backendResponse = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({ token: response.credential })
                });

                if (!backendResponse.ok) {
                  const errorData = await backendResponse.json();
                  throw new Error(errorData.message || `Failed to ${mode === 'login' ? 'login with' : 'link'} Google account`);
                }

                const data = await backendResponse.json();
                onSuccess(data);
                
                if (mode === 'link') {
                  window.location.reload();
                }
              } catch (error) {
                onError(error.message);
              }
            }
          },
          context: mode === 'login' ? 'signin' : 'use',
          ux_mode: 'popup',
          auto_select: false
        });

        const buttonContainer = document.getElementById('google-signin-button');
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'login' ? 'signin_with' : 'continue_with',
            width: 240,
            logo_alignment: 'center'
          });
        }

      } catch (error) {
        onError(error.message || 'Failed to initialize Google Sign-In');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    script.onerror = () => onError('Failed to load Google Sign-In');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [isLinked, onSuccess, onError, mode]);

  if (isLinked) {
    return (
      <Button
        variant="outlined"
        onClick={onUnlink}
        size="small"
        sx={{
          minWidth: '80px',
          height: '32px',
          borderColor: '#e0e0e0',
          color: '#424242',
          '&:hover': {
            borderColor: '#bdbdbd',
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        DISABLE
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', height: '40px', marginTop: mode === 'login' ? '16px' : '0px' }}>
      <div id="google-signin-button" />
    </Box>
  );
};

export default GoogleSignInButton;
