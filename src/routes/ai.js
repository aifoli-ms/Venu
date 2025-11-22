// src/routes/ai.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../supabaseClient');
const checkAuth = require('../middleware/authMiddleware');
const { createReservation } = require('../services/reservationService');

const router = express.Router();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let cachedRestaurantContext = "";

async function refreshRestaurantContext() {
    try {
        const { data: restaurants, error } = await supabase
            .from('restaurants')
            .select('id, name, cuisine_type, location, price_range, average_rating, price_range');

        if (error) throw error;

        // Add Price Range legend to the context for clarity
        const legend = "Price Ranges: $ (Budget), $$ (Mid-Range), $$$ (Fine Dining)";

        const context = restaurants.map(r =>
            `- [ID: ${r.id}] ${r.name} (${r.cuisine_type}): ${r.location}, Price: ${r.price_range}, Rating: ${r.average_rating} stars`
        ).join('\n');

        cachedRestaurantContext = `${legend}\n\nList:\n${context}`;
        console.log("Alfred's restaurant context refreshed.");

    } catch (err) {
        console.error("Failed to refresh AI context:", err);
    }
}

// Call once on module load
refreshRestaurantContext();

// --- TOOL DEFINITION ---
const reservationTool = {
    functionDeclarations: [
        {
            name: "makeReservation",
            description: "Reserve a table at a restaurant. Use this when the user explicitly asks to book or reserve a table.",
            parameters: {
                type: "OBJECT",
                properties: {
                    restaurant_id: {
                        type: "STRING",
                        description: "The ID of the restaurant to book (found in the context list).",
                    },
                    date: {
                        type: "STRING",
                        description: "The date of the reservation in YYYY-MM-DD format.",
                    },
                    time: {
                        type: "STRING",
                        description: "The time of the reservation in HH:MM format (24-hour).",
                    },
                    party_size: {
                        type: "INTEGER",
                        description: "The number of people for the reservation.",
                    },
                },
                required: ["restaurant_id", "date", "time", "party_size"],
            },
        },
    ],
};

router.post('/ask', checkAuth, async (req, res) => {
    const { user_input } = req.body;
    const userId = req.userId;

    if (!user_input) {
        return res.status(400).json({ message: "Input required" });
    }

    let reply = "I apologize, Alfred is currently unavailable. Please try again in a few moments.";

    try {
        // 1. Fetch user preference data (Reviews)
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating, restaurants(name, cuisine_type)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        // 2. Format user preference string
        const preferenceContext = reviews && reviews.length > 0
            ? "User Feedback:\n" + reviews.map(r =>
                `- Rated ${r.restaurants.name} (${r.restaurants.cuisine_type}) ${r.rating} stars.`
            ).join('\n')
            : "User has not submitted reviews, base recommendations on general data.";

        // 3. Fetch past chat history (Last 5 turns for short-term memory)
        const { data: chatHistory } = await supabase
            .from('ai_interactions')
            .select('user_prompt, alfred_response')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(5);

        // 4. Format chat history for prompt
        const chatContext = chatHistory && chatHistory.length > 0
            ? "Past Interactions (Use this for conversation flow):\n" + chatHistory.reverse().map(c =>
                `USER: ${c.user_prompt}\nALFRED: ${c.alfred_response}`
            ).join('\n---\n')
            : "This is the start of a new session.";

        // 5. Construct the comprehensive system instruction
        const systemInstruction = `
            You are Alfred, a sophisticated, friendly, and brief concierge for 'VENU', a restaurant reservation platform in Ghana.
            
            Current Time: ${new Date().toLocaleString('en-GH', { timeZone: 'Africa/Accra' })}

            -- CONTEXT --
            ${cachedRestaurantContext} 

            -- USER HISTORY --
            ${preferenceContext}
            
            -- PAST INTERACTIONS --
            ${chatContext}

            -- RULES --
            1.  Recommend only from the provided restaurant list.
            2.  Use the User Feedback to tailor recommendations.
            3.  Keep answers short, friendly, and helpful (max 3 sentences).
            4.  If the user wants to make a reservation, ask for any missing details (restaurant, date, time, party size) before calling the tool.
            5.  Use the 'makeReservation' tool ONLY when you have all the necessary details.
        `;

        // --- Generation Config for Robustness ---
        const generationConfig = {
            maxOutputTokens: 500,
            temperature: 0.5,
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction,
            config: generationConfig,
            tools: [reservationTool], // Add the tool here
        });

        // 6. Generate Response
        const result = await model.generateContent(user_input);
        const response = await result.response;

        // Check for function calls
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === "makeReservation") {
                const { restaurant_id, date, time, party_size } = call.args;
                console.log("Alfred initiating reservation:", call.args);

                try {
                    const confirmation = await createReservation(userId, restaurant_id, date, time, party_size);
                    reply = `I've successfully booked a table for ${party_size} at the restaurant for ${date} at ${time}. Enjoy your meal!`;
                } catch (resErr) {
                    console.error("Alfred reservation failed:", resErr);
                    reply = "I encountered an issue while trying to make that reservation. Please try again or check the details.";
                }
            }
        } else {
            // Normal text response
            const text = response.text();
            if (text) {
                reply = text;
            } else {
                console.error('Gemini API returned no text and no function call.');
            }
        }

        // 7. Save the interaction
        const { error: insertError } = await supabase
            .from('ai_interactions')
            .insert({
                user_id: userId,
                user_prompt: user_input,
                alfred_response: reply
            });

        if (insertError) console.error("Failed to save AI interaction:", insertError);

        res.status(200).json({ reply: reply });

    } catch (err) {
        console.error('Alfred Error:', err);

        try {
            await supabase
                .from('ai_interactions')
                .insert({
                    user_id: userId,
                    user_prompt: user_input,
                    alfred_response: reply
                });
        } catch (dbErr) {
            console.error('Failed to save error interaction:', dbErr);
        }

        res.status(500).json({ message: reply });
    }
});

module.exports = router;
