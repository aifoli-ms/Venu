const pool = require('../db');
const { getUser } = require('../jwt');
const { sanitizeInput } = require('../sanitize');

module.exports = async function handleMenus(req, res, uri) {
  const method = req.method;

  const restMenusMatch = uri.match(/^\/restaurants\/(\d+)\/menus\/?$/);
  if (method === 'GET' && restMenusMatch) {
    const id = restMenusMatch[1];
    const { rows } = await pool.query(
      'SELECT * FROM "Vmenus" WHERE "restaurant_id" = $1 AND "is_active" = 1 ORDER BY "name" ASC',
      [id]
    );
    return res.json(rows);
  }

  const menuItemsMatch = uri.match(/^\/menus\/(\d+)\/items\/?$/);
  if (method === 'GET' && menuItemsMatch) {
    const id = menuItemsMatch[1];
    const { rows } = await pool.query(`
      SELECT mi.*, mti.display_order, mti.is_available
      FROM "Vmenu_to_item" mti
      JOIN "Vmenu_items" mi ON mti.item_id = mi.id
      WHERE mti.menu_id = $1 AND mti.is_available = 1
      ORDER BY mti.display_order ASC
    `, [id]);
    return res.json(rows);
  }

  if (method === 'POST' && menuItemsMatch) {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const menuId = menuItemsMatch[1];
    const menuRes = await pool.query('SELECT * FROM "Vmenus" WHERE "id" = $1', [menuId]);
    if (menuRes.rows.length === 0) return res.status(404).json({ message: 'Menu not found' });
    const restaurantId = menuRes.rows[0].restaurant_id;

    const name = sanitizeInput(req.body?.name);
    const description = sanitizeInput(req.body?.description);
    const price = req.body?.price;

    if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

    const itemRes = await pool.query(
      'INSERT INTO "Vmenu_items" ("restaurant_id", "name", "description", "price", "image_url") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [restaurantId, name, description, price, req.body?.image_url || null]
    );

    const newItemId = itemRes.rows[0].id;
    await pool.query(
      'INSERT INTO "Vmenu_to_item" ("menu_id", "item_id", "display_order", "is_available") VALUES ($1, $2, 0, 1)',
      [menuId, newItemId]
    );

    return res.status(201).json({ message: 'Item added', id: newItemId, name });
  }

  const deleteItemMatch = uri.match(/^\/menus\/(\d+)\/items\/(\d+)\/?$/);
  if (method === 'DELETE' && deleteItemMatch) {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const [, menuId, itemId] = deleteItemMatch;
    await pool.query(
      'UPDATE "Vmenu_to_item" SET "is_available" = 0 WHERE "menu_id" = $1 AND "item_id" = $2',
      [menuId, itemId]
    );
    return res.json({ message: 'Item removed' });
  }

  const menuIdMatch = uri.match(/^\/menus\/(\d+)\/?$/);
  if (method === 'GET' && menuIdMatch) {
    const id = menuIdMatch[1];
    const { rows } = await pool.query('SELECT * FROM "Vmenus" WHERE "id" = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Menu not found' });
    return res.json(rows[0]);
  }

  if (method === 'POST' && /^\/menus\/?$/.test(uri)) {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const restaurant_id = req.body?.restaurant_id;
    const name = sanitizeInput(req.body?.name);
    const description = sanitizeInput(req.body?.description);

    if (!restaurant_id || !name) return res.status(400).json({ message: 'Restaurant ID and name are required.' });

    const { rows } = await pool.query(
      'INSERT INTO "Vmenus" ("restaurant_id", "name", "description", "is_active") VALUES ($1, $2, $3, 1) RETURNING *',
      [restaurant_id, name, description]
    );
    return res.status(201).json({ message: 'Menu created successfully', id: rows[0].id });
  }

  if (method === 'PUT' && menuIdMatch) {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const id = menuIdMatch[1];
    const updates = [];
    const values = [];
    let idx = 1;

    if (req.body?.name !== undefined) { updates.push(`"name" = $${idx++}`); values.push(sanitizeInput(req.body.name)); }
    if (req.body?.description !== undefined) { updates.push(`"description" = $${idx++}`); values.push(sanitizeInput(req.body.description)); }
    if (req.body?.is_active !== undefined) { updates.push(`"is_active" = $${idx++}`); values.push(req.body.is_active); }

    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE "Vmenus" SET ${updates.join(', ')} WHERE "id" = $${idx} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Menu not found' });
    return res.json({ message: 'Menu updated successfully', menu: rows[0] });
  }

  if (method === 'DELETE' && menuIdMatch) {
    const user = getUser(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const id = menuIdMatch[1];
    const { rows } = await pool.query(
      'UPDATE "Vmenus" SET "is_active" = 0 WHERE "id" = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Menu not found' });
    return res.json({ message: 'Menu deleted successfully' });
  }

  return res.status(404).json({ message: 'Menu route not found', uri, method });
};
