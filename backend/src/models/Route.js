const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['classic', 'temporary'],
    default: 'classic',
  },
  contentType: {
    type: String,
    required: true,
    default: 'text/html',
  },
  contentEncoding: {
    type: String,
    enum: ['text', 'base64', 'hex', 'file'],
    default: 'text',
  },
  fileName: {
    type: String,
    default: '',
  },
  contentDisposition: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  corsConfig: {
    enabled: { type: Boolean, default: false },
    allowOrigin: { type: String, default: '*' },
    allowMethods: { type: String, default: 'GET,POST,OPTIONS,DELETE,PUT' },
    allowHeaders: { type: String, default: '*' },
  },
  customHeaders: {
    type: [{ key: String, value: String }],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  temporarySince: {
    type: Date,
    default: null,
  },
  rateLimit: {
    enabled: { type: Boolean, default: false },
    maxRequests: { type: Number, default: 60 },
    windowMs: { type: Number, default: 60000 },
  },
});

RouteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Route', RouteSchema);
