// In-memory storage for development when MongoDB is not available
// This is ONLY for testing purposes - data will not persist

let users = [];
let tasks = [];
let userIdCounter = 1;
let taskIdCounter = 1;

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
      return users.find(user => user._id == id);
    },
    
    updateById: (id, updateData) => {
      const userIndex = users.findIndex(user => user._id == id);
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
      return tasks.find(task => task._id == id);
    },
    
    updateById: (id, updateData) => {
      const taskIndex = tasks.findIndex(task => task._id == id);
      if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updateData, updatedAt: new Date().toISOString() };
        return tasks[taskIndex];
      }
      return null;
    },
    
    deleteById: (id) => {
      const taskIndex = tasks.findIndex(task => task._id == id);
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