const mongoose = require('mongoose');
const User = require('../models/userModel');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.log('Local MongoDB connection failed, attempting to start in-memory database...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log(`MongoDB Connected (In-Memory): ${uri}`);

            // Seed Admin User
            const admin = await User.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password', // Hash handled by model pre-save
                role: 'admin'
            });
            console.log('Admin user seeded in memory DB');
        } catch (memError) {
            console.error(`Error: ${memError.message}`);
            process.exit(1);
        }
    }
};

module.exports = connectDB;


