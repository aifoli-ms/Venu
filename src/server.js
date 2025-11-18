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

// --- LOGIN ROUTE ---
app.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body

        // 1. Fetch user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single() // We expect only one user

        if (error || !user) {
            return res.status(400).send("Cannot find user")
        }

        // 2. Compare Passwords
        // Note: user.password_hash matches the column in your SQL table
        if (await bcrypt.compare(password, user.password_hash)) {
            res.send("Success") // Matches what frontend expects
        } else {
            res.send("Not Allowed")
        }

    } catch (err) {
        console.error(err)
        res.status(500).send("Server Error")
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})