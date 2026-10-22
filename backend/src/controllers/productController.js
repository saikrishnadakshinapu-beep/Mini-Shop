const Product = require('../models/Product');
const HttpError = require('../errors/HttpError');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listProducts(req, res) {
  const query = req.query.q ?? '';
  if (typeof query !== 'string') {
    throw new HttpError(400, 'INVALID_SEARCH', 'Search must be a single text value.');
  }
  const term = query.trim();
  if (term.length > 80) {
    throw new HttpError(400, 'INVALID_SEARCH', 'Search text must be 80 characters or fewer.');
  }

  const filter = term ? { name: { $regex: escapeRegex(term), $options: 'i' } } : {};
  const products = await Product.find(filter).sort({ name: 1 }).lean();
  res.json({ products });
}

module.exports = { listProducts };
