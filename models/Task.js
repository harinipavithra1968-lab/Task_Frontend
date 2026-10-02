const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [100, 'Title must be 100 characters or fewer'] },
    description: { type: String, trim: true, maxlength: [500, 'Description must be 500 characters or fewer'], default: '' },
    // Stored as "YYYY-MM-DD" so calendar matching has no timezone problems
    date: { type: String, required: [true, 'Date is required'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'] },
    status: { type: String, enum: { values: ['pending', 'in-progress', 'completed'], message: 'Invalid status' }, default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
