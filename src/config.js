// src/config.js - API Configuration
// This file helps switch between local and production API URLs

const getApiBaseUrl = () => {
    // Check if we're in production (deployed on Vercel)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Use the same origin as the frontend (Vercel deployment)
        return window.location.origin;
    }
    // Use local development server
    return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL };
}
