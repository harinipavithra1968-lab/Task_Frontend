const router = require('express').Router();
const multer = require('multer');

const auth = require('../middleware/auth');

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskImage,
} = require('../controllers/taskController');

// Store uploaded image temporarily in memory.
// It will be saved into MongoDB by the controller.
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only JPG, JPEG, PNG and WebP images are allowed'
        )
      );
    }
  },
});

// Every task route requires a valid JWT
router.use(auth);

// Get all tasks / Create task
router
  .route('/')
  .get(getTasks)
  .post(upload.single('image'), createTask);

// Task image
router.get('/:id/image', getTaskImage);

// Update / Delete task
router
  .route('/:id')
  .put(upload.single('image'), updateTask)
  .delete(deleteTask);

module.exports = router;