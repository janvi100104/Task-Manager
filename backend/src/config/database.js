const mongoose = require('mongoose');
const colors = require('../utils/colors');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      colors.cyan(`✅ MongoDB Connected: ${conn.connection.host}`)
    );
  } catch (error) {
    console.error(colors.red(`❌ Database connection failed: ${error.message}`));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(colors.yellow('\n⚠️  DEVELOPMENT MODE: Running without persistent database'));
      console.log(colors.yellow('📝 Data will not persist between server restarts'));
      console.log(colors.yellow('🔧 To fix: Install MongoDB or use MongoDB Atlas'));
      console.log(colors.yellow('🚀 Server will continue running for testing...\n'));
      
      // Continue without database in development mode
      return;
    }
    
    // In production, still exit on database errors
    process.exit(1);
  }
};

module.exports = connectDB;