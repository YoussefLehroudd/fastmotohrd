import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const useSubscriptionStatus = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let socket;

    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/subscriptions/current', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }

        const data = await response.json();
        setSubscriptionStatus(data?.status || 'expired');
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setSubscriptionStatus('expired');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSubscriptionStatus();

    // Set up WebSocket connection
    socket = io('http://localhost:5000', {
      withCredentials: true
    });

    socket.on('subscription_update', (data) => {
      if (data.type === 'expired') {
        setSubscriptionStatus('expired');
      } else if (data.subscription?.status) {
        setSubscriptionStatus(data.subscription.status);
      }
    });

    // Check subscription status every 30 seconds as backup
    const interval = setInterval(fetchSubscriptionStatus, 30000);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      clearInterval(interval);
    };
  }, []);

  return { subscriptionStatus, loading };
};

export default useSubscriptionStatus;
