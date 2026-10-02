const router = require('express').Router();
const auth = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(auth); // every task route needs a valid JWT
router.route('/').get(getTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);

module.exports = router;
