export const getAuthToken = () => {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies
    .find(cookie => cookie.trim().startsWith('token='));
  
  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.split('=')[1]);
};
