// api/index.js - Vercel Serverless Function Entry Point
const app = require('../src/server');

// Export the Express app as a serverless function
module.exports = app;
