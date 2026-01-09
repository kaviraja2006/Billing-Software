require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5001;

const startServer = () => {
    // Connect to Database (Non-blocking)
    connectDB().then(() => {
        console.log('Database connected successfully');
    }).catch(err => {
        console.error('Database connection failed:', err.message);
    });

    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();
