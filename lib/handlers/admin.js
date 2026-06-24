const pool = require('../db');
const { getUser } = require('../jwt');
const { sanitizeInput } = require('../sanitize');

async function requireAdmin(req, res) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return null; }

  const { rows } = await pool.query('SELECT "role" FROM "Vusers" WHERE "id" = $1', [user.userId]);
  if (rows.length === 0 || rows[0].role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
    return null;
  }
  return user.userId;
}

module.exports = async function handleAdmin(req, res, uri) {
  const method = req.method;
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  if (method === 'GET' && uri === '/admin/stats') {
    const users = await pool.query('SELECT COUNT(*) as count FROM "Vusers"');
    const reviews = await pool.query('SELECT COUNT(*) as count FROM "Vreviews"');
    const restaurants = await pool.query('SELECT COUNT(*) as count FROM "Vrestaurants"');
    return res.json({
      users: users.rows[0].count,
      reviews: reviews.rows[0].count,
      restaurants: restaurants.rows[0].count,
    });
  }

  if (method === 'GET' && uri === '/admin/users') {
    const { rows } = await pool.query('SELECT "id", "name", "email", "role" FROM "Vusers" ORDER BY "id" DESC');
    return res.json(rows);
  }

  const deleteUserMatch = uri.match(/^\/admin\/users\/(\d+)$/);
  if (method === 'DELETE' && deleteUserMatch) {
    const targetId = deleteUserMatch[1];
    if (String(targetId) === String(adminId)) return res.status(400).json({ message: 'Cannot delete yourself.' });

    const target = await pool.query('SELECT "role" FROM "Vusers" WHERE "id" = $1', [targetId]);
    if (target.rows.length > 0 && target.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Forbidden: Cannot delete another admin.' });
    }

    await pool.query('DELETE FROM "Vusers" WHERE "id" = $1', [targetId]);
    return res.json({ message: 'User deleted successfully.' });
  }

  const roleMatch = uri.match(/^\/admin\/users\/(\d+)\/role$/);
  if (method === 'POST' && roleMatch) {
    const targetId = roleMatch[1];
    const newRole = req.body?.role || 'owner';
    const restaurantId = req.body?.restaurant_id;

    await pool.query('UPDATE "Vusers" SET "role" = $1 WHERE "id" = $2', [newRole, targetId]);

    if (newRole === 'owner' && restaurantId) {
      await pool.query('UPDATE "Vrestaurants" SET "owner_id" = $1 WHERE "id" = $2', [targetId, restaurantId]);
      return res.json({ message: 'User promoted to owner and assigned to restaurant.' });
    } else if (newRole === 'user' || newRole === 'customer') {
      await pool.query('UPDATE "Vrestaurants" SET "owner_id" = NULL WHERE "owner_id" = $1', [targetId]);
      if (newRole === 'user') {
        await pool.query('UPDATE "Vusers" SET "role" = $1 WHERE "id" = $2', ['customer', targetId]);
      }
      return res.json({ message: 'User demoted to standard user.' });
    }
    return res.json({ message: `User role updated to ${newRole}.` });
  }

  if (method === 'GET' && uri === '/admin/reviews') {
    const { rows } = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name, rest.name as restaurant_name
      FROM "Vreviews" r
      JOIN "Vusers" u ON r.user_id = u.id
      JOIN "Vrestaurants" rest ON r.restaurant_id = rest.id
      ORDER BY r.created_at DESC
    `);
    return res.json(rows);
  }

  const deleteReviewMatch = uri.match(/^\/admin\/reviews\/(\d+)$/);
  if (method === 'DELETE' && deleteReviewMatch) {
    await pool.query('DELETE FROM "Vreviews" WHERE "id" = $1', [deleteReviewMatch[1]]);
    return res.json({ message: 'Review deleted successfully.' });
  }

  if (method === 'GET' && uri === '/admin/all_restaurants') {
    const { rows } = await pool.query('SELECT "id", "name", "owner_id" FROM "Vrestaurants" ORDER BY "name" ASC');
    return res.json(rows);
  }

  if (method === 'POST' && uri === '/admin/restaurants') {
    const required = ['name', 'location', 'cuisine_type', 'owner_id'];
    for (const field of required) {
      if (!req.body?.[field]) return res.status(400).json({ message: `Field '${field}' is required.` });
    }

    const ownerCheck = await pool.query('SELECT "id" FROM "Vusers" WHERE "id" = $1', [req.body.owner_id]);
    if (ownerCheck.rows.length === 0) return res.status(400).json({ message: 'Owner ID not found.' });

    const { rows } = await pool.query(
      'INSERT INTO "Vrestaurants" ("name", "location", "cuisine_type", "description", "image_url", "capacity", "owner_id") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        sanitizeInput(req.body.name),
        sanitizeInput(req.body.location),
        sanitizeInput(req.body.cuisine_type),
        sanitizeInput(req.body.description || ''),
        sanitizeInput(req.body.image_url || ''),
        Number(req.body.capacity || 0),
        req.body.owner_id,
      ]
    );
    return res.status(201).json({ message: 'Restaurant added successfully.', id: rows[0]?.id });
  }

  return res.status(404).json({ message: 'Not found' });
};
