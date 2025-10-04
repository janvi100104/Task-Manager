// In-memory storage for development when MongoDB is not available
// This is ONLY for testing purposes - data will not persist

let users = [];
let tasks = [];
let userIdCounter = 1;
let taskIdCounter = 1;

// Initialize with sample data for testing
function initializeSampleData() {
  if (users.length === 0 && tasks.length === 0) {
    // Create a sample user with a known password hash for 'password123'
    const bcrypt = require('bcryptjs');
    const sampleUser = {
      _id: userIdCounter++,
      name: 'Demo User',
      email: 'demo@example.com',
      password: bcrypt.hashSync('password123', 10), // Proper hash for 'password123'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      refreshTokens: []
    };
    users.push(sampleUser);

    // Create sample tasks
    const sampleTasks = [
      {
        _id: taskIdCounter++,
        title: 'Complete project documentation',
        description: 'Write comprehensive documentation for the task management system',
        priority: 'high',
        status: 'in-progress',
        assignee: sampleUser._id,
        createdBy: sampleUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['documentation', 'project'],
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      },
      {
        _id: taskIdCounter++,
        title: 'Fix login bug',
        description: 'Resolve the authentication issue in the login component',
        priority: 'high',
        status: 'pending',
        assignee: sampleUser._id,
        createdBy: sampleUser._id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['bug', 'authentication'],
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      },
      {
        _id: taskIdCounter++,
        title: 'Design new dashboard',
        description: 'Create wireframes and mockups for the new dashboard layout',
        priority: 'medium',
        status: 'pending',
        assignee: sampleUser._id,
        createdBy: sampleUser._id,
        tags: ['design', 'ui'],
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      },
      {
        _id: taskIdCounter++,
        title: 'Code review backlog',
        description: 'Review pending pull requests and provide feedback',
        priority: 'low',
        status: 'pending',
        assignee: sampleUser._id,
        createdBy: sampleUser._id,
        tags: ['review', 'code'],
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      }
    ];
    
    tasks.push(...sampleTasks);
    console.log(`Initialized memory store with ${users.length} user and ${tasks.length} sample tasks`);
  }
}

// Initialize sample data immediately
initializeSampleData();

const memoryStore = {
  // User operations
  users: {
    create: (userData) => {
      const user = {
        _id: userIdCounter++,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        refreshTokens: []
      };
      users.push(user);
      return user;
    },
    
    findByEmail: (email) => {
      return users.find(user => user.email === email);
    },
    
    findById: (id) => {
      return users.find(user => user._id == id || user._id === parseInt(id));
    },
    
    updateById: (id, updateData) => {
      const userIndex = users.findIndex(user => user._id == id || user._id === parseInt(id));
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date().toISOString() };
        return users[userIndex];
      }
      return null;
    }
  },
  
  // Task operations
  tasks: {
    create: (taskData) => {
      const task = {
        _id: taskIdCounter++,
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false
      };
      tasks.push(task);
      return task;
    },
    
    findByAssignee: (assigneeId) => {
      return tasks.filter(task => task.assignee == assigneeId && !task.isArchived);
    },
    
    findById: (id) => {
      return tasks.find(task => task._id == id || task._id === parseInt(id));
    },
    
    update: (id, updateData) => {
      const taskIndex = tasks.findIndex(task => task._id == id || task._id === parseInt(id));
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updateData, updatedAt: new Date().toISOString() };
        return tasks[taskIndex];
      }
      return null;
    },
    
    delete: (id) => {
      const taskIndex = tasks.findIndex(task => task._id == id || task._id === parseInt(id));
      if (taskIndex !== -1) {
        return tasks.splice(taskIndex, 1)[0];
      }
      return null;
    },
    
    updateById: (id, updateData) => {
      const taskIndex = tasks.findIndex(task => task._id == id || task._id === parseInt(id));
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updateData, updatedAt: new Date().toISOString() };
        return tasks[taskIndex];
      }
      return null;
    },
    
    deleteById: (id) => {
      const taskIndex = tasks.findIndex(task => task._id == id || task._id === parseInt(id));
      if (taskIndex !== -1) {
        return tasks.splice(taskIndex, 1)[0];
      }
      return null;
    }
  },
  
  // Clear all data
  clear: () => {
    users = [];
    tasks = [];
    userIdCounter = 1;
    taskIdCounter = 1;
  },
  
  // Get current data (for debugging)
  getData: () => ({
    users: users.length,
    tasks: tasks.length
  })
};

module.exports = memoryStore;