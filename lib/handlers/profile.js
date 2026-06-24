const pool = require('../db');
const { getUser } = require('../jwt');

module.exports = async function handleProfile(req, res, uri) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  if (req.method === 'GET' && uri === '/profile') {
    const { rows } = await pool.query(
      'SELECT "name", "email", "phone_number" FROM "Vusers" WHERE "id" = $1',
      [user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User data not found.' });
    return res.json(rows[0]);
  }

  return res.status(404).json({ message: 'Not found' });
};
