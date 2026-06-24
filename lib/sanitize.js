function sanitizeInput(data) {
  if (data == null) return '';
  if (Array.isArray(data)) return data.map(sanitizeInput);
  if (typeof data === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(data)) result[k] = sanitizeInput(v);
    return result;
  }
  const str = String(data);
  const clean = str.replace(/<[^>]*>/g, '');
  if (clean !== str) {
    const err = new Error('Invalid input: HTML tags are not allowed.');
    err.statusCode = 400;
    throw err;
  }
  return clean.trim();
}

module.exports = { sanitizeInput };
