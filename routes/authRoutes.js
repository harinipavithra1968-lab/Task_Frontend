const router = require('express').Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

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
    failureRedirect: 'http://localhost:5173/login',
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user.googleId,
        email: req.user.email,
        username: req.user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(
      `${process.env.CLIENT_URL}/?token=${token}`
    );
  }
);

module.exports = router;