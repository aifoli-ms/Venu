// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_KEY;

function checkAuth(req, res, next) {
    const authHeader = req.headers['authorization'];

    // 1. Check if Authorization header exists
    if (!authHeader) {
        return res.status(401).json({ message: "Access denied. No authorization token provided." });
    }

    // 2. Extract the token (Bearer <token>)
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. Invalid token format." });
    }

    // 3. Verify Token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('   ❌ Auth Failed: JWT Verification Error:', err.message);
            return res.status(403).json({ message: "Access forbidden. Invalid or expired token." });
        }

        // 4. Attach userId to request
        console.log(`   ✅ Auth Success: User ${decoded.userId}`);
        req.userId = decoded.userId;
        next();
    });
}

module.exports = checkAuth;
