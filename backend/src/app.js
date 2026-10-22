const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'starting', database: ready ? 'connected' : 'disconnected' });
});
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
