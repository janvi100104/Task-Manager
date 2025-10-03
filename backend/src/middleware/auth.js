const jwt = require('jsonwebtoken');
// Conditional imports based on MongoDB availability
let User;
try {
  User = require('../models/User');
} catch (error) {
  // MongoDB models not available, will use memory store
  console.log('MongoDB User model not available, using memory store in auth middleware');
  User = null;
}
const { verifyToken } = require('../utils/jwt');
const memoryStore = require('../utils/memoryStore');
const mongoose = require('mongoose');

/**
 * Middleware to authenticate and authorize users using JWT
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1 && User;
      let user;

      if (isMongoConnected) {
        // Get user from MongoDB
        user = await User.findById(decoded.userId).select('-password -refreshTokens');
      } else {
        // Get user from memory store
        user = memoryStore.users.findById(decoded.userId);
        if (user) {
          // Remove password from user object for security
          const { password, ...userWithoutPassword } = user;
          user = userWithoutPassword;
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Token is valid but user not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

/**
 * Middleware to check if user is admin (for future use)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const checkResourceOwnership = (resourceUserField = 'assignee') => {
  return (req, res, next) => {
    // This will be used in route handlers where we need to check
    // if the user can access/modify a specific resource
    req.checkOwnership = (resource) => {
      if (!resource) return false;
      
      // Check if user is the assignee or creator
      const isAssignee = resource[resourceUserField] && 
                        resource[resourceUserField].toString() === req.user._id.toString();
      const isCreator = resource.createdBy && 
                       resource.createdBy.toString() === req.user._id.toString();
      
      return isAssignee || isCreator;
    };
    
    next();
  };
};

/**
 * Optional authentication middleware (for public routes that can benefit from user context)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
        
        // Check if MongoDB is connected
        const isMongoConnected = mongoose.connection.readyState === 1 && User;
        let user;

        if (isMongoConnected) {
          user = await User.findById(decoded.userId).select('-password -refreshTokens');
        } else {
          user = memoryStore.users.findById(decoded.userId);
          if (user) {
            const { password, ...userWithoutPassword } = user;
            user = userWithoutPassword;
          }
        }
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    // Don't block the request for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  checkResourceOwnership,
  optionalAuth
};