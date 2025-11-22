// src/routes/profile.js
const express = require('express');
const supabase = require('../supabaseClient');
const checkAuth = require('../middleware/authMiddleware');

const router = express.Router();

// --- GET USER PROFILE (GET /profile) ---
router.get('/', checkAuth, async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('name, email, phone_number')
        .eq('id', req.userId)
        .single();

    if (error || !data) {
        return res.status(404).json({ message: "User data not found." });
    }
    res.status(200).json(data);
});

module.exports = router;
