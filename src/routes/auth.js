// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabaseClient');
const checkAuth = require('../middleware/authMiddleware');

const router = express.Router();

// --- GET ALL USERS (Debug) ---
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('users').select('*')
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// --- SIGNUP ROUTE (POST /users) ---
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        // 1. Check if user exists (by email)
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single()

        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" })
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // 3. Insert into Supabase
        const { error } = await supabase
            .from('users')
            .insert([
                {
                    name: name,
                    email: email,
                    phone_number: phone,
                    password_hash: hashedPassword
                }
            ])

        if (error) {
            console.error('Supabase Insert Error:', error)
            return res.status(500).json({ message: "Error creating user" })
        }

        res.status(201).json({ message: "User created successfully" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }
})

// --- LOGIN ROUTE (POST /users/login) ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        // 1. Fetch user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (error || !user) {
            return res.status(400).send("Cannot find user")
        }

        // 2. Compare Passwords
        if (await bcrypt.compare(password, user.password_hash)) {
            // Send user details for frontend session storage
            res.status(200).json({
                message: "Success",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            });
        } else {
            res.status(401).send("Not Allowed")
        }

    } catch (err) {
        console.error(err)
        res.status(500).send("Server Error")
    }
})

// --- UPDATE USER PROFILE (PATCH /users/:id) ---
router.patch('/:id', checkAuth, async (req, res) => {
    if (req.params.id != req.userId) {
        return res.status(403).json({ message: "Unauthorized attempt to modify another user's profile." });
    }

    const { name, phone, password } = req.body;
    const userId = req.userId;
    let updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone_number = phone;

    if (password) {
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }
        updates.password_hash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No data provided for update." });
    }

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('name, email, phone_number')
        .single();

    if (error) {
        console.error('Supabase Update Error:', error);
        return res.status(500).json({ message: "Failed to update profile." });
    }

    res.status(200).json({
        message: "Profile updated successfully.",
        user: data
    });
});

module.exports = router;
