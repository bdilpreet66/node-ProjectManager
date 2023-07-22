const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: String,
	total_cost: { type: Number, default: 0 },
	status: { type: String, default: 'pending' },
	completion_date: { type: Date, default: Date.now },
	created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});


module.exports = mongoose.model('Project', ProjectSchema);
