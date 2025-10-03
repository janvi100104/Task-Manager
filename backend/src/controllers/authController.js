// Conditional imports based on MongoDB availability
let User;
try {
  User = require('../models/User');
} catch (error) {
  // MongoDB models not available, will use memory store
  console.log('MongoDB User model not available, using memory store');
  User = null;
}

const { generateTokens, setRefreshTokenCookie, clearRefreshTokenCookie, verifyToken } = require('../utils/jwt');
const memoryStore = require('../utils/memoryStore');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Use MongoDB
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      const user = await User.create({ name, email, password });
      
      const { accessToken, refreshToken } = generateTokens(user._id);
      await user.addRefreshToken(refreshToken);
      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user, accessToken }
      });
    } else {
      // Use memory store for development
      const existingUser = memoryStore.users.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = memoryStore.users.create({
        name,
        email,
        password: hashedPassword
      });

      const { accessToken, refreshToken } = generateTokens(user._id);
      setRefreshTokenCookie(res, refreshToken);

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.status(201).json({
        success: true,
        message: 'User registered successfully (demo mode)',
        data: { user: userResponse, accessToken }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Use MongoDB
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      const isPasswordCorrect = await user.matchPassword(password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);
      await user.addRefreshToken(refreshToken);
      setRefreshTokenCookie(res, refreshToken);

      user.password = undefined;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user, accessToken }
      });
    } else {
      // Use memory store for development
      const user = memoryStore.users.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);
      setRefreshTokenCookie(res, refreshToken);

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful (demo mode)',
        data: { user: userResponse, accessToken }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (but requires refresh token)
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not provided'
      });
    }

    try {
      // Verify refresh token
      const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);

      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1 && User;
      
      if (isMongoConnected) {
        // Find user with this refresh token
        const user = await User.findByRefreshToken(token);
        if (!user || user._id.toString() !== decoded.userId) {
          return res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
          });
        }

        // Check if user is active
        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            error: 'Account is deactivated'
          });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

        // Remove old refresh token and add new one
        await user.removeRefreshToken(token);
        await user.addRefreshToken(newRefreshToken);

        // Set new refresh token as httpOnly cookie
        setRefreshTokenCookie(res, newRefreshToken);

        res.status(200).json({
          success: true,
          message: 'Token refreshed successfully',
          data: {
            accessToken
          }
        });
      } else {
        // Memory store mode - simplified refresh (no token storage)
        const user = memoryStore.users.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
          });
        }

        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            error: 'Account is deactivated'
          });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
        setRefreshTokenCookie(res, newRefreshToken);

        res.status(200).json({
          success: true,
          message: 'Token refreshed successfully (demo mode)',
          data: {
            accessToken
          }
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token'
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.cookies;

    if (token) {
      // Check if MongoDB is connected
      const isMongoConnected = mongoose.connection.readyState === 1 && User;
      
      if (isMongoConnected) {
        // Remove refresh token from user
        const user = await User.findByRefreshToken(token);
        if (user) {
          await user.removeRefreshToken(token);
        }
      }
      // For memory store, we don't need to remove tokens as they're not stored
    }

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAll = async (req, res, next) => {
  try {
    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1 && User;
    
    if (isMongoConnected) {
      // Remove all refresh tokens from user
      await req.user.removeAllRefreshTokens();
    }
    // For memory store, we don't need to remove tokens as they're not stored

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    // Check if MongoDB is connected
    const isMongoConnected = mongoose.connection.readyState === 1 && User;
    
    if (isMongoConnected) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, avatarUrl },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user
        }
      });
    } else {
      // Update user in memory store
      const user = memoryStore.users.updateById(req.user._id, { name, avatarUrl });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Remove password from response
      const { password, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully (demo mode)',
        data: {
          user: userResponse
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile
};