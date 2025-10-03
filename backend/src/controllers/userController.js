const User = require('../models/User');

/**
 * @desc    Get all users (for assignee dropdown)
 * @route   GET /api/users
 * @access  Private
 */
const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('name email avatarUrl')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalUsers,
          totalPages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email avatarUrl createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser
};