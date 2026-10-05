const Task = require('../models/Task');

const { asyncHandler } = require('../middleware/error');

// Pick only normal task fields from request body
const pick = (b) => {
  const out = {};

  ['title', 'description', 'date', 'status'].forEach((k) => {
    if (b[k] !== undefined) {
      out[k] = b[k];
    }
  });

  return out;
};

// Add image URL to the task response
const formatTask = (task, req) => {
  const obj = task.toObject();

  obj.imageUrl = obj.hasImage
    ? `${getBaseUrl(req)}/api/tasks/${task._id}/image`
    : null;

  delete obj.hasImage;

  return obj;
};

// GET /api/tasks
// GET /api/tasks?date=YYYY-MM-DD
exports.getTasks = asyncHandler(async (req, res) => {
  const filter = {
    user: req.userId,
  };

  if (req.query.date) {
    filter.date = req.query.date;
  }

  const tasks = await Task.find(filter)
    .sort({
      date: 1,
      createdAt: 1,
    })
    .select('+imageData +imageContentType');

  const result = tasks.map((task) => {
    const obj = task.toObject();

    obj.hasImage = !!task.imageData;

    // Do not send the actual binary image with the task list
    delete obj.imageData;
    delete obj.imageContentType;

    obj.imageUrl = obj.hasImage
      ? `${req.protocol}://${req.get('host')}/api/tasks/${task._id}/image`
      : null;

    return obj;
  });

  res.json(result);
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const taskData = {
    ...pick(req.body),
    user: req.userId,
  };

  // Save image in MongoDB
  if (req.file) {
    taskData.imageData = req.file.buffer;
    taskData.imageContentType = req.file.mimetype;
  }

  const task = await Task.create(taskData);

  const result = task.toObject();

  result.imageUrl = req.file
  ? `${getBaseUrl(req)}/api/tasks/${task._id}/image`:
   null;
  delete result.imageData;
  delete result.imageContentType;

  res.status(201).json(result);
});

// PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const updateData = pick(req.body);

  // If a new image was uploaded, replace the old image
  if (req.file) {
    updateData.imageData = req.file.buffer;
    updateData.imageContentType = req.file.mimetype;
  }

  const task = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.userId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check whether the task has an image
  const imageCheck = await Task.findById(task._id)
    .select('+imageData')
    .lean();

  const result = task.toObject();

 result.imageUrl = imageCheck?.imageData
  ? `${getBaseUrl(req)}/api/tasks/${task._id}/image`:
   null;

  delete result.imageData;
  delete result.imageContentType;

  res.json(result);
});

// GET /api/tasks/:id/image
exports.getTaskImage = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.userId,
  }).select('+imageData +imageContentType');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (!task.imageData) {
    res.status(404);
    throw new Error('Task has no image');
  }

  res.set('Content-Type', task.imageContentType);
  res.set('Cache-Control', 'public, max-age=3600');

  res.send(task.imageData);
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({
    message: 'Task deleted',
    id: task._id,
  });
});