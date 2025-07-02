const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  // دعم الهيدر بحروف صغيرة وكبيرة (authorization أو Authorization)
  // دعم كل حالات الهيدر (authorization/Authorization) مع لوج تشخيصي
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('🔒 [authMiddleware] No token found in header:', req.headers);
    return res.status(401).json({ message: '❌ Access Denied: لازم تكون مسجل دخول!' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // دعم كل من decoded._id و decoded.id حسب ما تم توليده في التوكن
    const userId = decoded._id || decoded.id;
    if (!userId) {
      console.log('🔒 [authMiddleware] لا يوجد معرف مستخدم في التوكن!', decoded);
      return res.status(401).json({ message: '❌ Invalid Token: لا يوجد معرف مستخدم في التوكن!' });
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log('🔒 [authMiddleware] المستخدم غير موجود في قاعدة البيانات!', userId);
      return res.status(401).json({ message: '❌ Invalid Token: المستخدم غير موجود!' });
    }
    req.user = user;
    console.log('🔑 [authMiddleware] user authenticated:', user.email, '| role:', user.role);
    next();
  } catch (err) {
    console.log('🔒 [authMiddleware] خطأ في التحقق من التوكن:', err.message);
    res.status(401).json({ message: '❌ Invalid Token: التوكن غير صالح!' });
  }
};

module.exports = authMiddleware;