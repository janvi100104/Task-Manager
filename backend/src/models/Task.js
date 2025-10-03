const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // Allow null/undefined or future dates
        return !value || value > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  priority: {
    type: String,
    enum: {
      values: ['high', 'medium', 'low', 'backlog'],
      message: 'Priority must be either high, medium, low, or backlog'
    },
    default: 'backlog'
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in-progress', 'completed'],
      message: 'Status must be either pending, in-progress, or completed'
    },
    default: 'pending'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have an assignee']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have a creator']
  },
  position: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ assignee: 1, priority: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1, position: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.status !== 'completed';
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const diffTime = this.dueDate - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to get tasks by priority with pagination
taskSchema.statics.getTasksByPriority = function(assigneeId, priority, page = 1, limit = 15) {
  const skip = (page - 1) * limit;
  
  return this.find({
    assignee: assigneeId,
    priority: priority,
    isArchived: false
  })
  .populate('assignee', 'name email avatarUrl')
  .populate('createdBy', 'name email')
  .sort({ position: 1, createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get task counts by priority
taskSchema.statics.getTaskCounts = function(assigneeId) {
  return this.aggregate([
    {
      $match: {
        assignee: new mongoose.Types.ObjectId(assigneeId),
        isArchived: false
      }
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get board data (all priorities with tasks)
taskSchema.statics.getBoardData = async function(assigneeId, limit = 15) {
  const priorities = ['high', 'medium', 'low', 'backlog'];
  const boardData = {};

  for (const priority of priorities) {
    const tasks = await this.getTasksByPriority(assigneeId, priority, 1, limit);
    const totalCount = await this.countDocuments({
      assignee: assigneeId,
      priority: priority,
      isArchived: false
    });

    boardData[priority] = {
      tasks,
      totalCount,
      hasMore: totalCount > limit
    };
  }

  return boardData;
};

// Instance method to update position within priority
taskSchema.methods.updatePosition = function(newPosition) {
  this.position = newPosition;
  return this.save();
};

// Ensure virtuals are included when converting to JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);