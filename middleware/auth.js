const jwt = require('jsonwebtoken');
const config = require('config');

/**
 * @description Verify Jason Web Token
 */
module.exports = function (req, res, next) {
  // Get token form header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authrization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
