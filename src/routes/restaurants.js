// src/routes/restaurants.js
const express = require('express');
const supabase = require('../supabaseClient');
const checkAuth = require('../middleware/authMiddleware');

const router = express.Router();

// --- GET ALL/FAVORITED RESTAURANTS (GET /restaurants) ---
router.get('/restaurants', async (req, res) => {
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
            const favoritedRestaurants = data.map(item => ({ ...item.restaurants, is_favorite: true }));
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

// --- GET SINGLE RESTAURANT DETAILS (GET /restaurants/:id) ---
router.get('/restaurants/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: "Restaurant not found" });

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching restaurant details:', err);
        res.status(500).json({ message: "Server error" });
    }
});

// --- TOGGLE FAVORITE (POST /favorites/toggle) ---
router.post('/favorites/toggle', checkAuth, async (req, res) => {
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

// --- GET RESTAURANT REVIEWS (GET /restaurants/:id/reviews) ---
router.get('/restaurants/:id/reviews', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                users (
                    name
                )
            `)
            .eq('restaurant_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: "Server error fetching reviews" });
    }
});

// --- ADD REVIEW (POST /restaurants/:id/reviews) ---
router.post('/restaurants/:id/reviews', checkAuth, async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    if (!rating || !comment) {
        return res.status(400).json({ message: "Rating and comment are required." });
    }

    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
                restaurant_id: id,
                user_id: userId,
                rating: parseInt(rating),
                comment: comment
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "Review added successfully", review: data[0] });
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ message: "Server error adding review" });
    }
});

module.exports = router;
