// src/routes/menus.js
const express = require('express');
const supabase = require('../supabaseClient');
const checkAuth = require('../middleware/authMiddleware');

const router = express.Router();

// --- GET ALL MENUS FOR A RESTAURANT (GET /restaurants/:id/menus) ---
router.get('/restaurants/:id/menus', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .eq('restaurant_id', id)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) throw error;

        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error fetching menus:', err);
        res.status(500).json({ message: "Server error fetching menus" });
    }
});

// --- GET SINGLE MENU (GET /menus/:id) ---
router.get('/menus/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('menus')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: "Menu not found" });

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ message: "Server error fetching menu" });
    }
});

// --- CREATE NEW MENU (POST /menus) ---
router.post('/menus', checkAuth, async (req, res) => {
    const { restaurant_id, name, description } = req.body;

    if (!restaurant_id || !name) {
        return res.status(400).json({ message: "Restaurant ID and name are required." });
    }

    try {
        const { data, error } = await supabase
            .from('menus')
            .insert([{
                restaurant_id: restaurant_id,
                name: name,
                description: description || null,
                is_active: true
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "Menu created successfully", menu: data[0] });
    } catch (err) {
        console.error('Error creating menu:', err);
        res.status(500).json({ message: "Server error creating menu" });
    }
});

// --- UPDATE MENU (PUT /menus/:id) ---
router.put('/menus/:id', checkAuth, async (req, res) => {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
    }

    try {
        const { data, error } = await supabase
            .from('menus')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Menu not found" });
        }

        res.status(200).json({ message: "Menu updated successfully", menu: data[0] });
    } catch (err) {
        console.error('Error updating menu:', err);
        res.status(500).json({ message: "Server error updating menu" });
    }
});

// --- DELETE MENU (DELETE /menus/:id) ---
// Soft delete by setting is_active to false
router.delete('/menus/:id', checkAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('menus')
            .update({ is_active: false })
            .eq('id', id)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Menu not found" });
        }

        res.status(200).json({ message: "Menu deleted successfully" });
    } catch (err) {
        console.error('Error deleting menu:', err);
        res.status(500).json({ message: "Server error deleting menu" });
    }
});

module.exports = router;
