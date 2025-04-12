import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useUser();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate page based on role
    if (user.role === 'seller') {
      return <Navigate to="/seller" />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    } else {
      return <Navigate to="/home" />;
    }
  }

  return children;
};

export default ProtectedRoute;
