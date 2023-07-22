const mongoose = require('mongoose');

const TaskCommentSchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  comment: { type: String, required: true },
  comment_date: { type: Date, default: Date.now },
  commented_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('TaskComment', TaskCommentSchema);
