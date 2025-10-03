const { body, validationResult } = require('express-validator');

// Common validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Task creation/update validation
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low', 'backlog'])
    .withMessage('Priority must be high, medium, low, or backlog'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed'),
  
  body('assignee')
    .optional()
    .isMongoId()
    .withMessage('Assignee must be a valid user ID'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Cannot have more than 10 tags');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 30) {
          throw new Error('Each tag must be a string with maximum 30 characters');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Task status update validation
const validateTaskStatus = [
  body('status')
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed'),
  
  handleValidationErrors
];

// Task priority update validation
const validateTaskPriority = [
  body('priority')
    .isIn(['high', 'medium', 'low', 'backlog'])
    .withMessage('Priority must be high, medium, low, or backlog'),
  
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  body(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateTaskStatus,
  validateTaskPriority,
  validatePagination,
  validateObjectId,
  handleValidationErrors
};