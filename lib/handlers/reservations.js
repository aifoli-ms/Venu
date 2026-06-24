const pool = require('../db');
const { getUser } = require('../jwt');
const { sanitizeInput } = require('../sanitize');

module.exports = async function handleReservations(req, res, uri) {
  const method = req.method;
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const userId = user.userId;

  if (method === 'GET' && uri === '/reservations/user') {
    const { rows } = await pool.query(`
      SELECT r.*,
             rest.name as restaurant_name,
             rest.location,
             rest.cuisine_type,
             rest.image_url
      FROM "Vreservations" r
      JOIN "Vrestaurants" rest ON r.restaurant_id = rest.id
      WHERE r.user_id = $1
      ORDER BY r.reservation_date DESC, r.reservation_time DESC
    `, [userId]);

    const formatted = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      restaurant_id: row.restaurant_id,
      reservation_date: row.reservation_date,
      reservation_time: row.reservation_time,
      party_size: row.party_size,
      status: row.status,
      created_at: row.created_at || null,
      restaurants: {
        name: row.restaurant_name,
        location: row.location,
        cuisine_type: row.cuisine_type,
        image_url: row.image_url,
      },
    }));
    return res.json(formatted);
  }

  const restResMatch = uri.match(/^\/reservations\/restaurant\/(\d+)$/);
  if (method === 'GET' && restResMatch) {
    const restaurantId = restResMatch[1];
    const check = await pool.query('SELECT * FROM "Vrestaurants" WHERE "id" = $1', [restaurantId]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Restaurant not found.' });
    if (Number(check.rows[0].owner_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Access Forbidden: You are not the owner of this restaurant.' });
    }

    const { rows } = await pool.query(`
      SELECT r.*, u.name as user_name
      FROM "Vreservations" r
      LEFT JOIN "Vusers" u ON r.user_id = u.id
      WHERE r.restaurant_id = $1
      ORDER BY r.reservation_date ASC, r.reservation_time ASC
    `, [restaurantId]);
    return res.json(rows);
  }

  if (method === 'POST' && uri === '/reservations') {
    const restaurant_id = sanitizeInput(req.body?.restaurant_id);
    const date = sanitizeInput(req.body?.reservation_date);
    const time = sanitizeInput(req.body?.reservation_time);
    const party_size = sanitizeInput(req.body?.party_size);

    if (!restaurant_id || !date || !time || !party_size) {
      return res.status(400).json({ message: 'Missing required reservation details.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) return res.status(400).json({ message: 'Cannot reserve a date in the past.' });

    const dup = await pool.query(
      `SELECT * FROM "Vreservations" WHERE "user_id" = $1 AND "restaurant_id" = $2 AND "reservation_date" = $3 AND "reservation_time" = $4`,
      [userId, restaurant_id, date, time]
    );
    for (const row of dup.rows) {
      if (row.status !== 'Cancelled') {
        return res.status(400).json({ message: 'You already have a reservation at this time.' });
      }
    }

    await pool.query(
      'INSERT INTO "Vreservations" ("user_id", "restaurant_id", "reservation_date", "reservation_time", "party_size", "status") VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, restaurant_id, date, time, party_size, 'Confirmed']
    );
    return res.status(201).json({ message: 'Reservation successfully created.' });
  }

  const deleteMatch = uri.match(/^\/reservations\/(\d+)$/);
  if (method === 'DELETE' && deleteMatch) {
    const reservationId = deleteMatch[1];
    const check = await pool.query(
      'SELECT * FROM "Vreservations" WHERE "id" = $1 AND "user_id" = $2',
      [reservationId, userId]
    );
    if (check.rows.length === 0) return res.status(404).json({ message: 'Reservation not found or access denied.' });

    await pool.query('DELETE FROM "Vreservations" WHERE "id" = $1', [reservationId]);
    return res.json({ message: 'Reservation cancelled successfully.' });
  }

  const statusMatch = uri.match(/^\/reservations\/(\d+)\/status$/);
  if (method === 'PATCH' && statusMatch) {
    const reservationId = statusMatch[1];
    const newStatus = sanitizeInput(req.body?.status);
    if (!newStatus) return res.status(400).json({ message: 'Status is required.' });

    const resQ = await pool.query('SELECT * FROM "Vreservations" WHERE "id" = $1', [reservationId]);
    if (resQ.rows.length === 0) return res.status(404).json({ message: 'Reservation not found.' });

    const restQ = await pool.query('SELECT * FROM "Vrestaurants" WHERE "id" = $1', [resQ.rows[0].restaurant_id]);
    if (restQ.rows.length === 0) return res.status(404).json({ message: 'Restaurant not found.' });
    if (Number(restQ.rows[0].owner_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Unauthorized: Only the restaurant owner can modify this reservation.' });
    }

    await pool.query('UPDATE "Vreservations" SET "status" = $1 WHERE "id" = $2', [newStatus, reservationId]);
    return res.json({ message: 'Reservation status updated.', status: newStatus });
  }

  return res.status(404).json({ message: 'Not found' });
};
