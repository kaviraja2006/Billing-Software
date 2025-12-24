require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5001;

const startServer = () => {
    // Connect to Database (Non-blocking)
    connectDB().then(() => {
        fs.writeFileSync(path.join(__dirname, 'db_status.txt'), `Connected at ${new Date().toISOString()}`);
    }).catch(err => {
        fs.writeFileSync(path.join(__dirname, 'db_status.txt'), `Failed at ${new Date().toISOString()}: ${err.message}`);
    });

    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();
