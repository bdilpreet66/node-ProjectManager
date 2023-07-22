const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: String,
	start_date: Date,
	end_date: Date,
	assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	is_active: { type: Boolean, default: true },
	status: String,
	project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
});

module.exports = mongoose.model('Task', TaskSchema);
