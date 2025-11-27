const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  location: String,
  rent: Number,
  type: String,
  details: String,
  extras: mongoose.Schema.Types.Mixed,
  imageUrl: String,
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);
