const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    stock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('Product', productSchema);
