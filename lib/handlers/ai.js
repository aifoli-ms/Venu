const pool = require('../db');
const { getUser } = require('../jwt');
const { sanitizeInput } = require('../sanitize');

module.exports = async function handleAi(req, res, uri) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const userId = user.userId;

  if (req.method === 'POST' && uri === '/alfred/ask') {
    const userInput = sanitizeInput(req.body?.user_input);
    if (!userInput) return res.status(400).json({ message: 'Input required' });

    const restResp = await pool.query('SELECT "id", "name", "cuisine_type", "location", "price_range", "average_rating" FROM "Vrestaurants"');
    const restaurants = restResp.rows;

    const menuResp = await pool.query(`
      SELECT mi.name, mi.price, m.restaurant_id
      FROM "Vmenu_items" mi
      JOIN "Vmenu_to_item" mti ON mi.id = mti.item_id
      JOIN "Vmenus" m ON mti.menu_id = m.id
      WHERE m.is_active = 1 AND mti.is_available = 1
    `);

    const menusByRest = {};
    for (const item of menuResp.rows) {
      if (!menusByRest[item.restaurant_id]) menusByRest[item.restaurant_id] = [];
      menusByRest[item.restaurant_id].push(item);
    }

    let restContext = "Price Ranges: ₵ (Budget), ₵₵ (Mid-Range), ₵₵₵ (Fine Dining)\n\nList:\n";
    for (const r of restaurants) {
      restContext += `- [ID: ${r.id}] ${r.name} (${r.cuisine_type}): ${r.location}, Price: ${r.price_range || 'N/A'}, Rating: ${r.average_rating || 'N/A'} stars\n`;
      if (menusByRest[r.id]) {
        const highlights = menusByRest[r.id].slice(0, 5).map(i => `${i.name} ₵${i.price}`);
        restContext += `  Menu Highlights: ${highlights.join(', ')}\n`;
      }
    }

    const reviewsResp = await pool.query(`
      SELECT rv.rating, r.name as restaurant_name, r.cuisine_type
      FROM "Vreviews" rv
      JOIN "Vrestaurants" r ON rv.restaurant_id = r.id
      WHERE rv.user_id = $1
      ORDER BY rv.created_at DESC LIMIT 5
    `, [userId]);

    let prefContext = "User has not submitted reviews, base recommendations on general data.";
    if (reviewsResp.rows.length > 0) {
      prefContext = "User Feedback:\n";
      for (const rev of reviewsResp.rows) {
        prefContext += `- Rated ${rev.restaurant_name} (${rev.cuisine_type}) ${rev.rating} stars.\n`;
      }
    }

    const histResp = await pool.query(
      'SELECT "user_prompt", "alfred_response" FROM "Vai_interactions" WHERE "user_id" = $1 ORDER BY "created_at" DESC LIMIT 5',
      [userId]
    );

    let chatContext = "This is the start of a new session.";
    if (histResp.rows.length > 0) {
      const history = [...histResp.rows].reverse();
      chatContext = "Past Interactions:\n";
      for (const h of history) {
        chatContext += `USER: ${h.user_prompt}\nALFRED: ${h.alfred_response}\n---\n`;
      }
    }

    const systemInstruction = `
      You are Alfred, a sophisticated, friendly, and brief concierge for 'VENU', a restaurant reservation platform in Ghana.
      Current Time: ${new Date().toISOString()}
      -- CONTEXT --
      ${restContext}
      -- USER HISTORY --
      ${prefContext}
      -- PAST INTERACTIONS --
      ${chatContext}
      -- RULES --
      1. Recommend only from the provided restaurant list.
      2. Use the User Feedback to tailor recommendations.
      3. Keep answers short, friendly, and helpful (max 3 sentences).
      4. If the user wants to make a reservation, ask for any missing details (restaurant, date, time, party size) before calling the tool.
      5. Use the 'makeReservation' tool ONLY when you have all the necessary details.
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: systemInstruction + "\n\nUser Input: " + userInput }] }],
      tools: [{
        function_declarations: [{
          name: 'makeReservation',
          description: 'Reserve a table at a restaurant.',
          parameters: {
            type: 'OBJECT',
            properties: {
              restaurant_id: { type: 'STRING', description: 'ID of the restaurant' },
              date: { type: 'STRING', description: 'YYYY-MM-DD' },
              time: { type: 'STRING', description: 'HH:MM' },
              party_size: { type: 'INTEGER', description: 'Number of people' },
            },
            required: ['restaurant_id', 'date', 'time', 'party_size'],
          },
        }],
      }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.5 },
    };

    let reply = "I apologize, Alfred is currently unavailable.";

    try {
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const geminiData = await geminiRes.json();
      const candidate = geminiData.candidates?.[0];

      if (candidate) {
        for (const part of candidate.content?.parts || []) {
          if (part.functionCall && part.functionCall.name === 'makeReservation') {
            const args = part.functionCall.args;
            try {
              await pool.query(
                'INSERT INTO "Vreservations" ("user_id", "restaurant_id", "reservation_date", "reservation_time", "party_size", "status") VALUES ($1, $2, $3, $4, $5, $6)',
                [userId, args.restaurant_id, args.date, args.time, args.party_size, 'Confirmed']
              );
              reply = `I've successfully booked a table for ${args.party_size} at the restaurant for ${args.date} at ${args.time}. Enjoy your meal!`;
            } catch {
              reply = "I encountered an issue while trying to make that reservation.";
            }
          } else if (part.text) {
            reply = part.text;
          }
        }
      }
    } catch {
      return res.status(500).json({ message: 'AI Service Unavailable' });
    }

    await pool.query(
      'INSERT INTO "Vai_interactions" ("user_id", "user_prompt", "alfred_response") VALUES ($1, $2, $3)',
      [userId, userInput, reply]
    );

    return res.json({ reply });
  }

  return res.status(404).json({ message: 'Not found' });
};
