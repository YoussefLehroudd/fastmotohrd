const jwt = require('jsonwebtoken');
const db = require('../db');

const getTokenFromRequest = (req) => {
  try {
    // Check for token in cookies first
    let token = req.cookies?.token;
    
    // If not in cookies, check Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Log token source for debugging
    if (token) {
      console.log('Token found in:', req.cookies?.token ? 'cookies' : 'Authorization header');
    } else {
      console.log('No token found in request');
      console.log('Cookies:', req.cookies);
      console.log('Headers:', req.headers);
    }
    
    return token;
  } catch (error) {
    console.error('Error extracting token:', error);
    return null;
  }
};

const verifyToken = (req, res, next) => {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const authenticateSeller = (req, res, next) => {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'seller') {
      return res.status(403).json({ message: 'Seller access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      console.log('Admin authentication failed: No token provided');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', { userId: decoded.id, role: decoded.role });
      
      if (decoded.role !== 'admin') {
        console.log('Admin authentication failed: User is not an admin');
        return res.status(403).json({ 
          message: 'Admin access required',
          error: 'User is not an admin'
        });
      }
      
      // Get fresh user data from database including Google auth info
      const [user] = await db.query(
        'SELECT id, role, email, google_id, isBlocked, isVerified FROM users WHERE id = ? AND role = ?',
        [decoded.id, 'admin']
      );

      if (!user.length) {
        console.log('Admin authentication failed: User not found or role changed');
        return res.status(403).json({ 
          message: 'Admin access required',
          error: 'User not found or role changed'
        });
      }

      // Check if user is blocked
      if (user[0].isBlocked) {
        console.log('Admin authentication failed: User is blocked');
        return res.status(403).json({
          message: 'Account blocked',
          error: 'Please contact support'
        });
      }

      // Additional verification for Google-authenticated admins
      if (user[0].google_id) {
        const emailDomain = user[0].email.split('@')[1];
        const allowedDomains = ['gmail.com', 'example.com']; // Add your allowed domains
        
        if (!allowedDomains.includes(emailDomain)) {
          console.log('Admin authentication failed: Unauthorized email domain', emailDomain);
          return res.status(403).json({
            message: 'Unauthorized email domain for admin access',
            error: 'Invalid domain'
          });
        }

        console.log('Google-authenticated admin verified:', {
          email: user[0].email,
          isVerified: user[0].isVerified
        });
      }

      // Update last activity timestamp
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user[0].id]
      );

      req.user = decoded;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(403).json({ 
        message: 'Invalid token',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({ 
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = {
  verifyToken,
  authenticateSeller,
  authenticateAdmin
};
