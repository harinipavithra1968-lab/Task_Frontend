const router = require('express').Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const {
  register,
  login,
  getMe,
} = require('../controllers/authController');

const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Google Sign-In
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.redirect(
      `${process.env.CLIENT_URL}/?token=${token}`
    );
  }
);

module.exports = router;