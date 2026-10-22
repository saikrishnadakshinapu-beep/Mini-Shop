const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { connectDatabase } = require('./config/database');

const port = Number(process.env.PORT) || 3000;
let server;

async function start() {
  try {
    await connectDatabase();
    server = app.listen(port, '0.0.0.0', () => {
      console.log(`MEAN Store API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`Unable to start the API: ${error.message}`);
    process.exitCode = 1;
  }
}

async function stop() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  const mongoose = require('mongoose');
  await mongoose.disconnect();
}

process.once('SIGINT', () => stop().finally(() => process.exit()));
process.once('SIGTERM', () => stop().finally(() => process.exit()));

start();
