// src/services/reservationService.js
const supabase = require('../supabaseClient');

async function createReservation(userId, restaurantId, date, time, partySize) {
    if (!restaurantId || !date || !time || !partySize) {
        throw new Error("Missing required reservation details.");
    }

    const { error } = await supabase
        .from('reservations')
        .insert({
            user_id: userId,
            restaurant_id: restaurantId,
            reservation_date: date,
            reservation_time: time,
            party_size: partySize,
            status: 'Confirmed'
        });

    if (error) {
        console.error('Supabase Reservation Insert Error:', error);
        throw new Error("Failed to create reservation.");
    }
    return "Reservation successfully created.";
}

module.exports = { createReservation };
