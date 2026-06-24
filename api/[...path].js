const handleAuth = require('../lib/handlers/auth');
const handleProfile = require('../lib/handlers/profile');
const handleRestaurants = require('../lib/handlers/restaurants');
const handleMenus = require('../lib/handlers/menus');
const handleReservations = require('../lib/handlers/reservations');
const handleAi = require('../lib/handlers/ai');
const handleAdmin = require('../lib/handlers/admin');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const rawUrl = (req.url || '').split('?')[0];
  const uri = rawUrl.replace(/^\/api/, '') || '/';

  try {
    if (/^\/users/.test(uri))        return await handleAuth(req, res, uri);
    if (/^\/profile/.test(uri))      return await handleProfile(req, res, uri);
    if (/^\/reservations/.test(uri)) return await handleReservations(req, res, uri);
    if (/^\/menus/.test(uri) || /^\/restaurants\/\d+\/menus/.test(uri))
                                     return await handleMenus(req, res, uri);
    if (/^\/restaurants/.test(uri) || /^\/favorites\/toggle/.test(uri))
                                     return await handleRestaurants(req, res, uri);
    if (/^\/alfred/.test(uri))       return await handleAi(req, res, uri);
    if (/^\/admin/.test(uri))        return await handleAdmin(req, res, uri);

    return res.status(404).json({ message: 'Not Found' });
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ message: err.message });
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
