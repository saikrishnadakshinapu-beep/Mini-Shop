const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const { seedCatalog } = require('../scripts/seedProducts');

const testUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/mean_store_test';
let server;
let baseUrl;

before(async () => {
  await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([Product.deleteMany({}), Order.deleteMany({})]);
  await seedCatalog();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (mongoose.connection.readyState === 1) await mongoose.disconnect();
});

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, options);
}

test('health and catalog endpoints return database-backed products and search results', async () => {
  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', database: 'connected' });

  const catalogResponse = await request('/api/products');
  assert.equal(catalogResponse.status, 200);
  const { products } = await catalogResponse.json();
  assert.equal(products.length, 5);
  assert.ok(products.some((product) => product.name === 'Bluetooth Speaker' && product.stock === 0));

  const searchResponse = await request('/api/products?q=hub');
  const search = await searchResponse.json();
  assert.equal(searchResponse.status, 200);
  assert.deepEqual(search.products.map((product) => product.name), ['USB-C Hub']);
});

test('order placement validates quantities, calculates totals, changes stock, and can be fetched', async () => {
  const mouse = await Product.findOne({ name: 'Wireless Mouse' }).lean();
  const hub = await Product.findOne({ name: 'USB-C Hub' }).lean();
  const invalid = await request('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ productId: mouse._id.toString(), quantity: 0 }] }),
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, 'INVALID_QUANTITY');

  const response = await request('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [
      { productId: mouse._id.toString(), quantity: 2 },
      { productId: hub._id.toString(), quantity: 1 },
    ] }),
  });
  assert.equal(response.status, 201);
  const { order } = await response.json();
  assert.match(order.orderNumber, /^ORD-[A-F\d]{24}$/);
  assert.equal(order.subtotal, 2897);
  assert.equal(order.total, 2897);
  assert.equal(order.items.length, 2);
  assert.equal((await Product.findById(mouse._id)).stock, 8);
  assert.equal((await Product.findById(hub._id)).stock, 14);

  const byNumber = await request(`/api/orders/${order.orderNumber}`);
  assert.equal(byNumber.status, 200);
  assert.equal((await byNumber.json()).order._id, order._id);
  const byId = await request(`/api/orders/${order._id}`);
  assert.equal(byId.status, 200);
});

test('orders reject missing products and insufficient inventory without changing stock', async () => {
  const mouse = await Product.findOne({ name: 'Wireless Mouse' }).lean();
  const outOfStock = await Product.findOne({ name: 'Bluetooth Speaker' }).lean();
  const missing = await request('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ productId: '000000000000000000000000', quantity: 1 }] }),
  });
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'PRODUCT_NOT_FOUND');

  const excessive = await request('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ productId: mouse._id.toString(), quantity: 999 }] }),
  });
  assert.equal(excessive.status, 409);
  assert.equal((await excessive.json()).error.code, 'INSUFFICIENT_STOCK');
  assert.equal((await Product.findById(mouse._id)).stock, 8);

  const unavailable = await request('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ productId: outOfStock._id.toString(), quantity: 1 }] }),
  });
  assert.equal(unavailable.status, 409);
  assert.equal((await Product.findById(outOfStock._id)).stock, 0);
});
