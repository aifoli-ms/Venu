const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const users = []

app.get('/users', (req, res) => {
    res.json(users)
})

app.post('/users', async (req, res) => {
    try {
        // 1. Accept 'phone' from the request body
        const { name, email, phone, password } = req.body 

        // 2. Validate that phone is present
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields (name, email, phone, password) are required" })
        }

        // (Optional) Check if email already exists...

        const hashedPassword = await bcrypt.hash(password, 10)

        // 3. Store the phone number in the user object
        const user = { 
            name, 
            email, 
            phone, // Saved here
            password: hashedPassword 
        }
        
        users.push(user)

        res.status(201).json({ message: "User created successfully" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal server error" })
    }
})

app.post('/users/login', async (req,res) => {
    const user = users.find(user=> user.name == req.body.name)
    if(user == null){
        return res.status(400).send("Cannot find user")
    }
    try{
       if(await bcrypt.compare(req.body.password,user.password)){
        res.send("Success")
       }else{
        res.send("Not Allowed")
       }
    }catch{
        res.status(500).send("Invalid Password")
    }
})

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})