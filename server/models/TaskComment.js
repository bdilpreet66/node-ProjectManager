const mongoose = require('mongoose');

const TaskCommentSchema = new mongoose.Schema({
	task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
	comment: { type: String, required: true },
	comment_date: { type: Date, default: Date.now },
	commented_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});


// Define a virtual property for formatted comment_date
TaskCommentSchema.virtual('formatted_comment_date').get(function () {
	const months = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const day = this.comment_date.getDate();
	const month = months[this.comment_date.getMonth()];
	const year = this.comment_date.getFullYear();

	return `${day} ${month} ${year}`;
});


module.exports = mongoose.model('TaskComment', TaskCommentSchema);
