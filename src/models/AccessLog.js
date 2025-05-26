const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    required: true
  },
  query: {
    type: Object
  },
  body: {
    type: Object
  },
  headers: {
    type: Object
  },
  rawRequest: {
    type: String
  }
});

module.exports = mongoose.model('AccessLog', AccessLogSchema);