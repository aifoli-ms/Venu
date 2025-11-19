// src/server.js
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const supabase = require('./supabaseClient') // Import the connection

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


// ==========================================================
// --- MIDDLEWARE: AUTHENTICATION CHECK ---
// ==========================================================
function checkAuth(req, res, next) {
    const userId = req.headers['x-user-id']; 
    if (!userId) {
        return res.status(403).json({ message: "Access forbidden. User not authenticated." });
    }
    // Attach userId to the request object for use in protected routes
    req.userId = userId;
    next();
}


// ==========================================================
// --- USER AUTHENTICATION ROUTES ---
// ==========================================================

// --- GET ALL USERS (Debug) ---
app.get('/users', async (req, res) => {
    const { data, error } = await supabase.from('users').select('*')
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
})

// --- SIGNUP ROUTE (POST /users) ---
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


// ==========================================================
// --- PROFILE MANAGEMENT ROUTES (PROTECTED) ---
// ==========================================================

// --- GET USER PROFILE (GET /profile) ---
app.get('/profile', checkAuth, async (req, res) => {
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

// --- UPDATE USER PROFILE (PATCH /users/:id) ---
app.patch('/users/:id', checkAuth, async (req, res) => {
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


// ==========================================================
// --- RESTAURANT DISCOVERY ROUTES ---
// ==========================================================

// --- GET ALL/FAVORITED RESTAURANTS (GET /restaurants) (MODIFIED) ---
app.get('/restaurants', async (req, res) => {
    const filter = req.query.filter;
    const userId = req.headers['x-user-id']; // Read potential user ID from header
    
    try {
        if (filter === 'favorites') {
            // 1. Check for authentication if filtering by favorites
            if (!userId) {
                return res.status(403).json({ message: "Must be logged in to view favorites." });
            }

            // 2. Query favorites table and join restaurants data
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    restaurants (
                        *
                    )
                `)
                .eq('user_id', userId);

            if (error) throw error;
            
            // 3. Flatten the response and explicitly set is_favorite: true
            const favoritedRestaurants = data.map(item => ({...item.restaurants, is_favorite: true}));
            return res.status(200).json(favoritedRestaurants);

        } else {
            // Default (Explore) View: Fetch all restaurants and LEFT JOIN favorites if user is logged in
            let data;
            let error;
            
            if (userId) {
                // Query all restaurants and check if a favorite exists for this user ID
                const { data: joinedData, error: joinError } = await supabase
                    .from('restaurants')
                    .select(`
                        *,
                        favorites!left(user_id)
                    `);
                
                error = joinError;
                
                // Process joined data to flatten and set is_favorite flag
                data = joinedData ? joinedData.map(restaurant => ({
                    ...restaurant,
                    // Check if the favorites array contains a matching user_id
                    is_favorite: restaurant.favorites.some(f => f.user_id == userId),
                    favorites: undefined // Clean up complex array
                })) : [];
                
            } else {
                // User is not logged in: Fetch all restaurants normally
                const { data: allData, error: allError } = await supabase
                    .from('restaurants')
                    .select('*');
                data = allData;
                error = allError;
            }

            if (error) {
                console.error('Supabase fetch error:', error);
                return res.status(500).json({ message: "Failed to fetch restaurants" });
            }
            
            return res.status(200).json(data);
        }

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// --- TOGGLE FAVORITE (POST /favorites/toggle) ---
app.post('/favorites/toggle', checkAuth, async (req, res) => {
    const userId = req.userId;
    const { restaurant_id } = req.body; 

    if (!restaurant_id) {
        return res.status(400).json({ message: "Restaurant ID is required." });
    }

    try {
        // 1. Check if the favorite already exists
        const { data: existingFavorite, error: selectError } = await supabase
            .from('favorites')
            .select('user_id')
            .eq('user_id', userId)
            .eq('restaurant_id', restaurant_id)
            .single();

        if (existingFavorite) {
            // 2. If favorite exists, DELETE it (Unfavorite)
            const { error: deleteError } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('restaurant_id', restaurant_id);

            if (deleteError) throw deleteError;
            return res.status(200).json({ message: "Unfavorited successfully.", is_favorite: false });

        } else if (selectError && selectError.code === 'PGRST116') {
             // 3. If favorite does not exist (PGRST116: no row found), INSERT it (Favorite)
            const { error: insertError } = await supabase
                .from('favorites')
                .insert([{ user_id: userId, restaurant_id: restaurant_id }]);

            if (insertError) throw insertError;
            return res.status(201).json({ message: "Favorited successfully.", is_favorite: true });
        } else {
             // Handle any other unexpected select error
             throw selectError;
        }

    } catch (err) {
        console.error('Favorite Toggle Error:', err);
        res.status(500).json({ message: "Internal server error during favorite operation." });
    }
});

// ==========================================================
// --- RESERVATION ROUTES (PROTECTED) ---
// ==========================================================

// --- GET USER RESERVATIONS (GET /reservations/user) ---
app.get('/reservations/user', checkAuth, async (req, res) => {
    const userId = req.userId;

    try {
        // Fetch reservations for the logged-in user, and join with the restaurants table
        const { data: reservations, error } = await supabase
            .from('reservations')
            .select(`
                *,
                restaurants (
                    name,
                    location,
                    cuisine_type,
                    image_url
                )
            `)
            .eq('user_id', userId)
            .order('reservation_date', { ascending: false })
            .order('reservation_time', { ascending: false });

        if (error) {
            console.error('Supabase Reservations Fetch Error:', error);
            return res.status(500).json({ message: "Failed to fetch reservations." });
        }

        res.status(200).json(reservations);

    } catch (err) {
        console.error('Server error fetching reservations:', err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// --- CREATE NEW RESERVATION (POST /reservations) ---
app.post('/reservations', checkAuth, async (req, res) => {
    const userId = req.userId;

    const { 
        restaurant_id, 
        reservation_date, 
        reservation_time, 
        party_size 
    } = req.body;
    
    if (!restaurant_id || !reservation_date || !reservation_time || !party_size) {
        return res.status(400).json({ message: "Missing required reservation details." });
    }

    try {
        const { error } = await supabase
            .from('reservations')
            .insert({
                user_id: userId,
                restaurant_id: restaurant_id,
                reservation_date: reservation_date,
                reservation_time: reservation_time,
                party_size: party_size,
                status: 'Confirmed'
            });

        if (error) {
            console.error('Supabase Reservation Insert Error:', error);
            return res.status(500).json({ message: "Failed to create reservation." });
        }

        res.status(201).json({ message: "Reservation successfully created." });

    } catch (err) {
        console.error('Server error creating reservation:', err);
        res.status(500).json({ message: "Internal server error." });
    }
});


// ==========================================================
// --- START SERVER ---
// ==========================================================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})