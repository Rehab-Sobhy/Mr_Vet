const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '❌ Access Denied: لازم تكون مسجل دخول!' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select('-password');
    if (!user) {
      return res.status(401).json({ message: '❌ Invalid Token: المستخدم غير موجود!' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: '❌ Invalid Token: التوكن غير صالح!' });
  }
};

module.exports = authMiddleware;