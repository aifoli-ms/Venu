const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || '';

function sign(payload) {
  return jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '24h' });
}

function verify(token) {
  try {
    return jwt.verify(token, SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

function getUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  return verify(token);
}

module.exports = { sign, verify, getUser };
