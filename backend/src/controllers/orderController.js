const mongoose = require('mongoose');
const Order = require('../models/Order');
const { placeOrder } = require('../services/orderService');
const HttpError = require('../errors/HttpError');

async function createOrder(req, res) {
  if (!req.body || !Array.isArray(req.body.items)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Send an items array to place an order.');
  }
  const order = await placeOrder(req.body.items);
  res.status(201).json({ order });
}

async function getOrder(req, res) {
  const identifier = req.params.id;
  let order;
  if (/^ORD-[a-f\d]{24}$/i.test(identifier)) {
    const id = identifier.slice(4);
    order = await Order.findById(id).lean();
  } else if (mongoose.isValidObjectId(identifier)) {
    order = await Order.findById(identifier).lean();
  } else {
    throw new HttpError(400, 'INVALID_ORDER_ID', 'The order ID is invalid.');
  }

  if (!order) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', 'We could not find that order.');
  }
  res.json({ order });
}

module.exports = { createOrder, getOrder };
