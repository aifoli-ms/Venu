const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const USERS_DB_PATH = path.join(__dirname, 'users.json')

const ensureUsersFile = () => {
    try {
        if (!fs.existsSync(USERS_DB_PATH)) {
            fs.writeFileSync(USERS_DB_PATH, JSON.stringify([], null, 2))
        }
    } catch (err) {
        console.error('Failed to initialize users store:', err)
    }
}

const loadUsers = () => {
    try {
        ensureUsersFile()
        const raw = fs.readFileSync(USERS_DB_PATH, 'utf8')
        return JSON.parse(raw)
    } catch (err) {
        console.error('Failed to load users:', err)
        return []
    }
}

const saveUsers = (data) => {
    try {
        fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2))
    } catch (err) {
        console.error('Failed to save users:', err)
    }
}

let users = loadUsers()

app.get('/users', (req, res) => {
    res.json(users)
})

// --- SIGNUP ROUTE (Includes Phone) ---
app.post('/users', async (req, res) => {
    try {
        // Accept phone here
        const { name, email, phone, password } = req.body 

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        // check if user exists
        if (users.find(user => user.email === email)) {
             return res.status(400).json({ message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Store phone in the database
        const user = { name, email, phone, password: hashedPassword }
        users.push(user)
        saveUsers(users)

        res.status(201).json({ message: "User created" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }
})

// --- LOGIN ROUTE (No Phone needed) ---
app.post('/users/login', async (req,res) => {
    // Find user by EMAIL
    const user = users.find(user => user.email === req.body.email)
    
    if (user == null) {
        return res.status(400).send("Cannot find user")
    }
    try {
       if(await bcrypt.compare(req.body.password, user.password)){
        res.send("Success")
       } else {
        res.send("Not Allowed")
       }
    } catch {
        res.status(500).send("Invalid Password")
    }
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})