const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: false, default: '' },
    last_name: { type: String, required: false, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    job_title: { type: String, required: false, default: 'Supervisor' },
    type: { type: String, required: true },
    hourly_rate: { type: Number, required: true },
    created_by: { type: String, required: false, default: '' },
});

module.exports = mongoose.model('User', UserSchema);
