// src/routes/reservations.js
const express = require('express');
const supabase = require('../supabaseClient');
const checkAuth = require('../middleware/authMiddleware');
const { createReservation } = require('../services/reservationService');

const router = express.Router();

// --- GET USER RESERVATIONS (GET /reservations/user) ---
router.get('/user', checkAuth, async (req, res) => {
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
router.post('/', checkAuth, async (req, res) => {
    const userId = req.userId;
    const {
        restaurant_id,
        reservation_date,
        reservation_time,
        party_size
    } = req.body;

    try {
        const message = await createReservation(userId, restaurant_id, reservation_date, reservation_time, party_size);
        res.status(201).json({ message });
    } catch (err) {
        console.error('Server error creating reservation:', err);
        const status = err.message === "Missing required reservation details." ? 400 : 500;
        res.status(status).json({ message: err.message });
    }
});

module.exports = router;
