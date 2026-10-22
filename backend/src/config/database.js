const mongoose = require('mongoose');

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is required. Copy backend/.env.example to backend/.env and configure it.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  return mongoose.connection;
}

module.exports = { connectDatabase };
