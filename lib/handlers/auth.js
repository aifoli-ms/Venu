const bcrypt = require('bcryptjs');
const pool = require('../db');
const { sign, getUser } = require('../jwt');
const { sanitizeInput } = require('../sanitize');

module.exports = async function handleAuth(req, res, uri) {
  const method = req.method;

  if (method === 'POST' && uri === '/users/login') {
    const { email: rawEmail, password } = req.body || {};
    const email = sanitizeInput(rawEmail);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { rows } = await pool.query('SELECT * FROM "Vusers" WHERE "email" = $1', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Cannot find user' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Not Allowed' });
    }

    const token = sign({ userId: user.id });
    const userData = { id: user.id, email: user.email, name: user.name, role: user.role || 'user' };

    if (user.role === 'owner') {
      const r = await pool.query('SELECT "id" FROM "Vrestaurants" WHERE "owner_id" = $1 LIMIT 1', [user.id]);
      if (r.rows.length > 0) userData.owner_restaurant_id = r.rows[0].id;
    }

    return res.json({ message: 'Success', token, user: userData });
  }

  if (method === 'POST' && uri === '/users') {
    const name = sanitizeInput(req.body?.name);
    const email = sanitizeInput(req.body?.email);
    const phone = sanitizeInput(req.body?.phone);
    const password = req.body?.password || '';

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'The password is a bit too short... try 8 chars minimum' });
    }
    if (password.length > 64) {
      return res.status(400).json({ message: 'The password is too long! Keep it under 64 please' });
    }

    let points = 0;
    if (/[A-Z]/.test(password)) points++;
    if (/[a-z]/.test(password)) points++;
    if (/[0-9]/.test(password)) points++;
    if (/[^A-Za-z0-9]/.test(password)) points++;
    if (points < 3) {
      return res.status(400).json({ message: 'Password too simple. Use a mix of letters, numbers and symbols.' });
    }

    const existing = await pool.query('SELECT "id" FROM "Vusers" WHERE "email" = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO "Vusers" ("name", "email", "phone_number", "password_hash") VALUES ($1, $2, $3, $4)',
      [name, email, phone, hash]
    );

    return res.status(201).json({ message: 'User created successfully' });
  }

  if (method === 'PATCH' && /^\/users\/([a-zA-Z0-9-]+)$/.test(uri)) {
    const requestId = uri.match(/^\/users\/([a-zA-Z0-9-]+)$/)[1];
    const user = getUser(req);
    if (!user || String(user.userId) !== String(requestId)) {
      return res.status(403).json({ message: "Unauthorized attempt to modify another user's profile." });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (req.body?.name) { updates.push(`"name" = $${idx++}`); values.push(sanitizeInput(req.body.name)); }
    if (req.body?.phone) { updates.push(`"phone_number" = $${idx++}`); values.push(sanitizeInput(req.body.phone)); }
    if (req.body?.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
      updates.push(`"password_hash" = $${idx++}`);
      values.push(await bcrypt.hash(req.body.password, 10));
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No data provided for update.' });
    }

    values.push(user.userId);
    const { rows } = await pool.query(
      `UPDATE "Vusers" SET ${updates.join(', ')} WHERE "id" = $${idx} RETURNING "name", "email", "phone_number"`,
      values
    );

    if (rows.length === 0) return res.status(404).json({ message: 'User not found or not updated' });

    return res.json({ message: 'Profile updated successfully.', user: rows[0] });
  }

  if (method === 'GET' && uri === '/users') {
    const { rows } = await pool.query('SELECT * FROM "Vusers"');
    return res.json(rows);
  }

  return res.status(404).json({ message: 'Not found' });
};
