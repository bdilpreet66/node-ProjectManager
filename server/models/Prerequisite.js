const mongoose = require('mongoose');

const PrerequisiteSchema = new mongoose.Schema({
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    prerequisite_task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
});

module.exports = mongoose.model('Prerequisite', PrerequisiteSchema);
