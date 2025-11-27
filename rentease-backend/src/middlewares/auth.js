const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if(!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch(err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = { protect };
