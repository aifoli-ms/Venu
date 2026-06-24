const pool = require('../db');
const { getUser } = require('../jwt');
const { sanitizeInput } = require('../sanitize');

module.exports = async function handleRestaurants(req, res, uri) {
  const method = req.method;
  const user = getUser(req);
  const userId = user ? user.userId : null;

  if (method === 'GET' && uri === '/restaurants') {
    const filter = req.query?.filter;

    if (filter === 'favorites') {
      if (!userId) return res.status(403).json({ message: 'Must be logged in to view favorites.' });

      const { rows } = await pool.query(`
        SELECT r.*, 1 as is_favorite,
               COUNT(rv.id) as total_reviews,
               ROUND(COALESCE(AVG(rv.rating), 0), 1) as average_rating
        FROM "Vrestaurants" r
        JOIN "Vfavorites" f ON r.id = f.restaurant_id
        LEFT JOIN "Vreviews" rv ON r.id = rv.restaurant_id
        WHERE f.user_id = $1
        GROUP BY r.id
      `, [userId]);

      rows.forEach(r => r.is_favorite = true);
      return res.json(rows);
    }

    const { rows } = await pool.query(`
      SELECT r.*,
             COUNT(rv.id) as total_reviews,
             ROUND(COALESCE(AVG(rv.rating), 0), 1) as average_rating
      FROM "Vrestaurants" r
      LEFT JOIN "Vreviews" rv ON r.id = rv.restaurant_id
      GROUP BY r.id
    `);

    if (userId) {
      const favRes = await pool.query('SELECT "restaurant_id" FROM "Vfavorites" WHERE "user_id" = $1', [userId]);
      const favIds = favRes.rows.map(r => r.restaurant_id);
      rows.forEach(r => r.is_favorite = favIds.includes(r.id));
    } else {
      rows.forEach(r => r.is_favorite = false);
    }

    return res.json(rows);
  }

  const detailMatch = uri.match(/^\/restaurants\/(\d+)$/);
  if (method === 'GET' && detailMatch) {
    const id = detailMatch[1];
    const { rows } = await pool.query('SELECT * FROM "Vrestaurants" WHERE "id" = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
    return res.json(rows[0]);
  }

  if (method === 'PATCH' && detailMatch) {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const id = detailMatch[1];

    const { rows: restRows } = await pool.query('SELECT * FROM "Vrestaurants" WHERE "id" = $1', [id]);
    if (restRows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
    if (Number(restRows[0].owner_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Forbidden: You do not own this restaurant.' });
    }

    const permitted = ['name', 'location', 'capacity', 'cuisine_type', 'description', 'image_url'];
    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of permitted) {
      if (req.body?.[field] !== undefined) {
        updates.push(`"${field}" = $${idx++}`);
        values.push(sanitizeInput(req.body[field]));
      }
    }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update.' });

    values.push(id);
    await pool.query(`UPDATE "Vrestaurants" SET ${updates.join(', ')} WHERE "id" = $${idx}`, values);

    return res.json({ message: 'Restaurant updated successfully.' });
  }

  const reviewsMatch = uri.match(/^\/restaurants\/(\d+)\/reviews$/);
  if (method === 'GET' && reviewsMatch) {
    const id = reviewsMatch[1];
    const { rows } = await pool.query(`
      SELECT rv.*, u.name
      FROM "Vreviews" rv
      LEFT JOIN "Vusers" u ON rv.user_id = u.id
      WHERE rv.restaurant_id = $1
      ORDER BY rv.created_at DESC
    `, [id]);

    const formatted = rows.map(row => {
      const r = { ...row, users: { name: row.name } };
      delete r.name;
      return r;
    });
    return res.json(formatted);
  }

  if (method === 'POST' && reviewsMatch) {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const id = reviewsMatch[1];
    const rating = req.body?.rating;
    const comment = sanitizeInput(req.body?.comment);

    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required.' });

    const { rows } = await pool.query(
      'INSERT INTO "Vreviews" ("restaurant_id", "user_id", "rating", "comment") VALUES ($1, $2, $3, $4) RETURNING *',
      [id, userId, Number(rating), comment]
    );

    return res.status(201).json({ message: 'Review added successfully', review: rows[0] || null });
  }

  if (method === 'POST' && uri === '/favorites/toggle') {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const restaurant_id = req.body?.restaurant_id;
    if (!restaurant_id) return res.status(400).json({ message: 'Restaurant ID is required.' });

    const check = await pool.query(
      'SELECT "id" FROM "Vfavorites" WHERE "user_id" = $1 AND "restaurant_id" = $2',
      [userId, restaurant_id]
    );

    if (check.rows.length > 0) {
      await pool.query('DELETE FROM "Vfavorites" WHERE "user_id" = $1 AND "restaurant_id" = $2', [userId, restaurant_id]);
      return res.json({ message: 'Unfavorited successfully.', is_favorite: false });
    }

    await pool.query('INSERT INTO "Vfavorites" ("user_id", "restaurant_id") VALUES ($1, $2)', [userId, restaurant_id]);
    return res.status(201).json({ message: 'Favorited successfully.', is_favorite: true });
  }

  return res.status(404).json({ message: 'Not found' });
};
