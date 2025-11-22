// src/middleware/authMiddleware.js

function checkAuth(req, res, next) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(403).json({ message: "Access forbidden. User not authenticated." });
    }
    // Attach userId to the request object for use in protected routes
    req.userId = userId;
    next();
}

module.exports = checkAuth;
