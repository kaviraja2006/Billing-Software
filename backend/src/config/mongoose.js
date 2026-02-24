const mongoose = require('mongoose');

let isConnected = false;

const connectMongo = async () => {
    if (isConnected) {
        return mongoose.connection;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        isConnected = true;
        console.log('✅ MongoDB connected for company analytics:', conn.connection.host);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
    }
};

// Graceful disconnect
const disconnectMongo = async () => {
    if (!isConnected) return;

    try {
        await mongoose.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
};

module.exports = { connectMongo, disconnectMongo };
