/*import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;*/



import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userRole } = useAuth();

  // 1. If not logged in at all, go to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 2. If roles are required for this route, check them
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If user is kitchen trying to see admin, send them to their own display
    if (userRole === 'kitchen') return <Navigate to="/orders-display" />;
    // Otherwise just send home
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;