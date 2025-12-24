const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error(`MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }

    // Development / Test fallback
    console.warn('MongoDB connection failed. Starting in-memory MongoDB...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();

      await mongoose.connect(uri);
      console.log(`MongoDB Connected (In-Memory): ${uri}`);
    } catch (memError) {
      const logPath = path.join(__dirname, '../../backend_startup_error.txt');
      const errorMsg = `
[${new Date().toISOString()}]
Primary DB Error: ${error.message}
In-Memory DB Error: ${memError.message}

Stack:
${memError.stack}
`;

      fs.writeFileSync(logPath, errorMsg);
      console.error('Database startup failed. Check backend_startup_error.txt');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
