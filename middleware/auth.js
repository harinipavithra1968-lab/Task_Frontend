const jwt = require('jsonwebtoken');

// Protects routes: expects "Authorization: Bearer <token>"
module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, token missing'));
  }
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch {
    res.status(401);
    next(new Error('Not authorized, token invalid or expired'));
  }
};
