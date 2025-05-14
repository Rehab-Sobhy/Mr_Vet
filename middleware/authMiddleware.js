const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '❌ Access Denied: لازم تكون مسجل دخول!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // فقط تحقق من صحة التوكن من JWT، بدون أي تحقق من activeToken أو انتهاء صلاحية مخصص
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: '❌ Invalid Token: المستخدم غير موجود!' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Error verifying token:', err.message);
    res.status(401).json({ message: '❌ Invalid Token: التوكن غير صالح!' });
  }
};

module.exports = authMiddleware;