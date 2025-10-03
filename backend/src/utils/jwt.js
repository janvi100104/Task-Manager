const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { 
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: 'cleaner-app',
      audience: 'cleaner-users'
    }
  );
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'cleaner-app',
      audience: 'cleaner-users'
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {object} Decoded token payload
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret, {
    issuer: 'cleaner-app',
    audience: 'cleaner-users'
  });
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @returns {object} Object containing both tokens
 */
const generateTokens = (userId) => {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId)
  };
};

/**
 * Set refresh token as httpOnly cookie
 * @param {object} res - Express response object
 * @param {string} token - Refresh token
 */
const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth'
  };

  res.cookie('refreshToken', token, cookieOptions);
};

/**
 * Clear refresh token cookie
 * @param {object} res - Express response object
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth'
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
};