const Task = require('../models/Task');
const { asyncHandler } = require('../middleware/error');

const pick = (b) => {
  const out = {};
  ['title', 'description', 'date', 'status'].forEach((k) => { if (b[k] !== undefined) out[k] = b[k]; });
  return out;
};

// GET /api/tasks?date=YYYY-MM-DD  (date optional)
exports.getTasks = asyncHandler(async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.date) filter.date = req.query.date;
  res.json(await Task.find(filter).sort({ date: 1, createdAt: 1 }));
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...pick(req.body), user: req.userId });
  res.status(201).json(task);
});

// PUT /api/tasks/:id  (only the owner can update)
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, pick(req.body), { new: true, runValidators: true });
  if (!task) { res.status(404); throw new Error('Task not found'); }
  res.json(task);
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) { res.status(404); throw new Error('Task not found'); }
  res.json({ message: 'Task deleted', id: task._id });
});
