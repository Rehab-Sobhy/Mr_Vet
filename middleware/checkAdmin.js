// Middleware للتحقق من صلاحيات الأدمن فقط
module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '❌ غير مصرح لك (أدمن فقط)' });
  }
};
