// src/server.js
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const supabase = require('./supabaseClient') // Import the connection

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// --- GET ALL USERS (Optional / Debugging) ---
app.get('/users', async (req, res) => {
    const { data, error } = await supabase.from('users').select('*')
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// --- SIGNUP ROUTE ---
app.post('/users', async (req, res) => {
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
                    phone_number: phone, // Matches the column name in SQL schema
                    password_hash: hashedPassword // Matches the column name in SQL schema
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

// --- LOGIN ROUTE (Updated) ---
app.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body

        // 1. Fetch user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single() 

        if (error || !user) {
            // Sends status 400 for user not found
            return res.status(400).send("Cannot find user")
        }

        // 2. Compare Passwords
        if (await bcrypt.compare(password, user.password_hash)) {
            // FIX: Send a JSON response containing user ID and details for session storage
            res.status(200).json({
                message: "Success",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name 
                }
            });
        } else {
            // FIX: Send a proper status code (401 Unauthorized)
            res.status(401).send("Not Allowed")
        }

    } catch (err) {
        console.error(err)
        res.status(500).send("Server Error")
    }
})


// --- NEW: Authentication Middleware ---
// Reads the userId from the header 'X-User-Id'
function checkAuth(req, res, next) {
    // The frontend will pass the userId in a custom header
    const userId = req.headers['x-user-id']; 
    if (!userId) {
        return res.status(403).json({ message: "Access forbidden. User not authenticated." });
    }
    // Attach userId to the request object for use in protected routes
    req.userId = userId;
    next();
}

// Example of how to use middleware for a protected route (e.g., getting user profile)
app.get('/profile', checkAuth, async (req, res) => {
    // req.userId is now available and verified
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

app.get('/restaurants', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*') 

        if (error) {
            console.error('Supabase fetch error:', error);
            return res.status(500).json({ message: "Failed to fetch restaurants" });
        }

        res.status(200).json(data);

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ message: "Internal server error" });
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})