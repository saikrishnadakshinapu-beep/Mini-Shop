const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/database');
const Product = require('../src/models/Product');

const catalog = [
  { name: 'Wireless Mouse', price: 799, stock: 10 },
  { name: 'Mechanical Keyboard', price: 2499, stock: 5 },
  { name: 'USB-C Hub', price: 1299, stock: 15 },
  { name: 'Bluetooth Speaker', price: 1999, stock: 0 },
  { name: 'Laptop Stand', price: 899, stock: 8 },
];

async function seedCatalog() {
  for (const product of catalog) {
    await Product.updateOne(
      { name: product.name },
      { $setOnInsert: product },
      { upsert: true, runValidators: true },
    );
  }
  return catalog.length;
}

async function seedProducts() {
  await connectDatabase();
  const count = await seedCatalog();
  console.log(`Catalog ready (${count} products; existing stock preserved).`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seedProducts().catch(async (error) => {
    console.error(`Catalog seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}

module.exports = { catalog, seedCatalog };
