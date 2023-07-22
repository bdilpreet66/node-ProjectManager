const mongoose = require('mongoose');

const WorkHourSchema = new mongoose.Schema({
  hours: { type: Number, required: true },
  minutes: { type: Number, required: true },
  Rate: { type: Number, required: true },
  recorded_date: { type: Date, required: true },
  approved: { type: Boolean, default: false },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('WorkHour', WorkHourSchema);
