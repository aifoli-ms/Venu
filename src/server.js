// src/server.js
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const express = require('express')
const cors = require('cors')

// Import Routes
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const restaurantsRouter = require('./routes/restaurants');
const reservationsRouter = require('./routes/reservations');
const aiRouter = require('./routes/ai');
const menusRouter = require('./routes/menus');

const app = express()
const PORT = process.env.PORT || 3000

// Define CORS options to allow all origins during development
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions))
app.use(express.json())

// Serve static files from src directory
app.use(express.static(path.join(__dirname)))
app.use('/img', express.static(path.join(__dirname, '..', 'img')))

// ==========================================================
// --- ROUTES ---
// ==========================================================

// Mount Auth Routes (Signup, Login, Update) at /users
app.use('/users', authRouter);

// Mount Profile Routes at /profile
app.use('/profile', profileRouter);

// Mount Restaurant & Favorite Routes at / (to preserve existing paths like /restaurants and /favorites/toggle)
app.use('/', restaurantsRouter);

// Mount Reservation Routes at /reservations
app.use('/reservations', reservationsRouter);

// Mount AI Routes at /alfred
app.use('/alfred', aiRouter);

// Mount Menu Routes at /menus and /restaurants/:id/menus
app.use('/', menusRouter);

// Explicit Root Route - serve homepage
app.get('/', (req, res) => {
    // Use process.cwd() to get the project root directory
    // This is more reliable in Vercel serverless environment
    const homepagePath = path.join(process.cwd(), 'src', 'homepage', 'homepage.html');
    console.log('Attempting to serve homepage from:', homepagePath);

    res.sendFile(homepagePath, (err) => {
        if (err) {
            console.error('Error serving homepage:', err);
            res.status(404).send('Homepage not found: ' + err.message);
        }
    });
});




// ==========================================================
// --- START SERVER ---
// ==========================================================
// Only start the server if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}

// Export the Express app for Vercel serverless functions
module.exports = app;