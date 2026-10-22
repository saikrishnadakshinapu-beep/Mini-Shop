const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const HttpError = require('../errors/HttpError');

async function placeOrder(inputItems) {
  if (!Array.isArray(inputItems) || inputItems.length === 0 || inputItems.length > 50) {
    throw new HttpError(400, 'INVALID_ITEMS', 'Add at least one product to the order.');
  }

  const quantities = new Map();
  for (const item of inputItems) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new HttpError(400, 'INVALID_ITEM', 'Each order item must include a product ID and quantity.');
    }

    const { productId, quantity } = item;
    if (typeof productId !== 'string' || !mongoose.isValidObjectId(productId)) {
      throw new HttpError(400, 'INVALID_PRODUCT_ID', 'One or more product IDs are invalid.');
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) {
      throw new HttpError(400, 'INVALID_QUANTITY', 'Product quantities must be whole numbers from 1 to 999.');
    }

    const key = productId.toLowerCase();
    const combined = (quantities.get(key) || 0) + quantity;
    if (!Number.isSafeInteger(combined)) {
      throw new HttpError(400, 'INVALID_QUANTITY', 'The requested quantity is too large.');
    }
    quantities.set(key, combined);
  }

  const productIds = [...quantities.keys()];
  const products = await Product.find({ _id: { $in: productIds } });
  if (products.length !== productIds.length) {
    throw new HttpError(404, 'PRODUCT_NOT_FOUND', 'One or more products are no longer available. Refresh the catalog and try again.');
  }

  const byId = new Map(products.map((product) => [product.id, product]));
  const requested = productIds
    .map((id) => ({ product: byId.get(id), quantity: quantities.get(id) }))
    .sort((a, b) => a.product.id.localeCompare(b.product.id));

  for (const { product, quantity } of requested) {
    if (product.stock < quantity) {
      throw new HttpError(409, 'INSUFFICIENT_STOCK', `${product.name} has only ${product.stock} available. Refresh your cart and try again.`);
    }
  }

  const reserved = [];
  try {
    for (const { product, quantity } of requested) {
      const result = await Product.updateOne(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
      );
      if (result.modifiedCount !== 1) {
        throw new HttpError(409, 'INSUFFICIENT_STOCK', `${product.name} no longer has enough stock. Refresh your cart and try again.`);
      }
      reserved.push({ productId: product._id, quantity });
    }

    const items = requested.map(({ product, quantity }) => ({
      productId: product._id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    if (!Number.isSafeInteger(subtotal)) {
      throw new HttpError(400, 'ORDER_TOTAL_TOO_LARGE', 'The order total exceeds the supported limit.');
    }

    const _id = new mongoose.Types.ObjectId();
    const order = await Order.create({
      _id,
      orderNumber: `ORD-${_id.toString().toUpperCase()}`,
      items,
      subtotal,
      total: subtotal,
    });
    return order;
  } catch (error) {
    if (reserved.length) {
      try {
        await Promise.all(reserved.map(({ productId, quantity }) =>
          Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }),
        ));
      } catch (rollbackError) {
        console.error('Order inventory compensation failed:', rollbackError);
      }
    }
    throw error;
  }
}

module.exports = { placeOrder };
