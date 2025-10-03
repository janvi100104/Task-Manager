const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', getMe);
router.put('/me', updateProfile);

module.exports = router;