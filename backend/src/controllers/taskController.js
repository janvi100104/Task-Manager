// Conditional imports based on MongoDB availability
let Task, User;
try {
  Task = require('../models/Task');
  User = require('../models/User');
} catch (error) {
  // MongoDB models not available, will use memory store
  console.log('MongoDB models not available, using memory store in task controller');
  Task = null;
  User = null;
}

const memoryStore = require('../utils/memoryStore');
const mongoose = require('mongoose');

/**
 * @desc    Get all tasks for authenticated user with pagination
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 15,
      priority,
      status,
      board = false
    } = req.query;

    const userId = req.user._id;
    const isMongoConnected = mongoose.connection.readyState === 1 && Task;

    if (isMongoConnected) {
      // MongoDB implementation
      if (board === 'true') {
        const boardData = await Task.getBoardData(userId, parseInt(limit));
        return res.status(200).json({
          success: true,
          data: boardData
        });
      }

      // Build query
      const query = {
        assignee: userId,
        isArchived: false
      };

      if (priority) query.priority = priority;
      if (status) query.status = status;

      // Execute query with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const tasks = await Task.find(query)
        .populate('assignee', 'name email avatarUrl')
        .populate('createdBy', 'name email')
        .sort({ priority: 1, position: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalTasks = await Task.countDocuments(query);
      const totalPages = Math.ceil(totalTasks / limit);

      res.status(200).json({
        success: true,
        data: {
          tasks,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            totalTasks,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } else {
      // Memory store implementation
      let tasks = memoryStore.tasks.findByAssignee(userId);
      
      // Apply filters
      if (priority) {
        tasks = tasks.filter(task => task.priority === priority);
      }
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }

      if (board === 'true') {
        // Group tasks by priority for board view
        const priorities = ['high', 'medium', 'low', 'backlog'];
        const boardData = {};
        
        priorities.forEach(priority => {
          const priorityTasks = tasks.filter(task => task.priority === priority)
            .slice(0, parseInt(limit));
          
          boardData[priority] = {
            tasks: priorityTasks,
            totalCount: tasks.filter(task => task.priority === priority).length,
            hasMore: tasks.filter(task => task.priority === priority).length > parseInt(limit)
          };
        });

        return res.status(200).json({
          success: true,
          data: boardData
        });
      }

      // Pagination for list view
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedTasks = tasks.slice(skip, skip + parseInt(limit));
      const totalPages = Math.ceil(tasks.length / limit);

      res.status(200).json({
        success: true,
        data: {
          tasks: paginatedTasks,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            totalTasks: tasks.length,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1 && Task;
    let task;

    if (isMongoConnected) {
      // MongoDB implementation
      task = await Task.findById(req.params.id)
        .populate('assignee', 'name email avatarUrl')
        .populate('createdBy', 'name email avatarUrl');
    } else {
      // Memory store implementation
      task = memoryStore.tasks.findById(req.params.id);
      if (task) {
        // Add assignee and creator info
        const assignee = memoryStore.users.findById(task.assignee);
        const createdBy = memoryStore.users.findById(task.createdBy);
        
        task = {
          ...task,
          assignee: assignee ? {
            _id: assignee._id,
            name: assignee.name,
            email: assignee.email,
            avatarUrl: assignee.avatarUrl
          } : null,
          createdBy: createdBy ? {
            _id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email,
            avatarUrl: createdBy.avatarUrl
          } : null
        };
      }
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user can access this task (simplified for memory store)
    const canAccess = task.assignee && (task.assignee._id == req.user._id || task.assignee == req.user._id) ||
                     task.createdBy && (task.createdBy._id == req.user._id || task.createdBy == req.user._id);
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view tasks assigned to you or created by you.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority = 'backlog',
      status = 'pending',
      assignee,
      tags = []
    } = req.body;

    // If assignee is not provided, assign to the creator
    const taskAssignee = assignee || req.user._id;
    const isMongoConnected = mongoose.connection.readyState === 1 && Task && User;

    if (isMongoConnected) {
      // MongoDB implementation
      // Verify assignee exists
      const assigneeUser = await User.findById(taskAssignee);
      if (!assigneeUser) {
        return res.status(404).json({
          success: false,
          error: 'Assignee user not found'
        });
      }

      // Get the next position for this priority
      const lastTask = await Task.findOne({
        assignee: taskAssignee,
        priority,
        isArchived: false
      }).sort({ position: -1 });

      const position = lastTask ? lastTask.position + 1 : 0;

      const task = await Task.create({
        title,
        description,
        dueDate,
        priority,
        status,
        assignee: taskAssignee,
        createdBy: req.user._id,
        position,
        tags
      });

      // Populate the task before sending response
      await task.populate('assignee', 'name email avatarUrl');
      await task.populate('createdBy', 'name email avatarUrl');

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: {
          task
        }
      });
    } else {
      // Memory store implementation
      // Verify assignee exists in memory store
      const assigneeUser = memoryStore.users.findById(taskAssignee);
      if (!assigneeUser) {
        return res.status(404).json({
          success: false,
          error: 'Assignee user not found'
        });
      }

      // Get the next position for this priority
      const existingTasks = memoryStore.tasks.findByAssignee(taskAssignee)
        .filter(task => task.priority === priority);
      const position = existingTasks.length;

      const task = memoryStore.tasks.create({
        title,
        description,
        dueDate,
        priority,
        status,
        assignee: taskAssignee,
        createdBy: req.user._id,
        position,
        tags
      });

      // Add assignee and creator info for response
      const createdBy = memoryStore.users.findById(req.user._id);
      const responseTask = {
        ...task,
        assignee: {
          _id: assigneeUser._id,
          name: assigneeUser.name,
          email: assigneeUser.email,
          avatarUrl: assigneeUser.avatarUrl
        },
        createdBy: {
          _id: createdBy._id,
          name: createdBy.name,
          email: createdBy.email,
          avatarUrl: createdBy.avatarUrl
        }
      };

      res.status(201).json({
        success: true,
        message: 'Task created successfully (demo mode)',
        data: {
          task: responseTask
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user can modify this task
    if (!req.checkOwnership(task)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only modify tasks assigned to you or created by you.'
      });
    }

    const {
      title,
      description,
      dueDate,
      priority,
      status,
      assignee,
      tags
    } = req.body;

    // If assignee is being changed, verify the new assignee exists
    if (assignee && assignee !== task.assignee.toString()) {
      const assigneeUser = await User.findById(assignee);
      if (!assigneeUser) {
        return res.status(404).json({
          success: false,
          error: 'Assignee user not found'
        });
      }
    }

    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        dueDate,
        priority,
        status,
        assignee,
        tags
      },
      {
        new: true,
        runValidators: true
      }
    )
    .populate('assignee', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task status
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user can modify this task
    if (!req.checkOwnership(task)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only modify tasks assigned to you or created by you.'
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true
      }
    )
    .populate('assignee', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task priority and position
 * @route   PATCH /api/tasks/:id/priority
 * @access  Private
 */
const updateTaskPriority = async (req, res, next) => {
  try {
    const { priority, position } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user can modify this task
    if (!req.checkOwnership(task)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only modify tasks assigned to you or created by you.'
      });
    }

    // Update task priority and position
    const updateData = { priority };
    if (position !== undefined) {
      updateData.position = position;
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('assignee', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Task priority updated successfully',
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user can delete this task
    if (!req.checkOwnership(task)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete tasks assigned to you or created by you.'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get task counts by priority
    const priorityCounts = await Task.getTaskCounts(userId);

    // Get task counts by status
    const statusCounts = await Task.aggregate([
      {
        $match: {
          assignee: userId,
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get overdue tasks count
    const overdueTasks = await Task.countDocuments({
      assignee: userId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
      isArchived: false
    });

    // Get tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.countDocuments({
      assignee: userId,
      dueDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'completed' },
      isArchived: false
    });

    res.status(200).json({
      success: true,
      data: {
        priorityCounts,
        statusCounts,
        overdueTasks,
        tasksDueToday
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
  deleteTask,
  getTaskStats
};