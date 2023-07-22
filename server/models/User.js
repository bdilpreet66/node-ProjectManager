const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, required: true },
  hourly_rate: { type: Number, required: true },
  created_by: { type: String, default: '' },
});

module.exports = mongoose.model('User', UserSchema);
