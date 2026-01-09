const mongoose = require('mongoose');
const User = require('../models/userModel');

const fs = require('fs');
const path = require('path');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error('Please check your MONGO_URI environment variable.');
        process.exit(1);
    }
};

module.exports = connectDB;


