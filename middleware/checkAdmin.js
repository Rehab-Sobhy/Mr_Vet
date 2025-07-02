// Middleware للتحقق من صلاحيات الأدمن فقط
module.exports = (req, res, next) => {
  // لوج لمراقبة الدور الفعلي
  console.log('🔒 checkAdmin | user:', req.user ? req.user.email : 'no user', '| role:', req.user ? req.user.role : 'no role');
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '❌ غير مصرح لك (أدمن فقط)', role: req.user ? req.user.role : null });
  }
};
