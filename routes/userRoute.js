const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware'); // Middleware لرفع الملفات
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ✅ جلب كل المستخدمين
router.get('/', authMiddleware, userController.getAllUsers);

// ✅ تسجيل مستخدم جديد
router.post('/register', userController.register);

// ✅ تحديث بيانات مستخدم
router.put('/:id', authMiddleware, userController.updateUser);

// ✅ حذف مستخدم
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);

// ✅ رفع صورة الملف الشخصي
router.post('/profile/upload', authMiddleware, upload.single('profileImage'), userController.uploadProfileImage);

// ✅ جلب كل أسماء المحاضرين
router.get('/instructors', userController.getAllInstructors);

// ✅ جلب بيانات المستخدم من التوكن (بما فيها الصورة والكورسات)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('enrolledCourses');
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: '❌ حصلت مشكلة أثناء جلب البيانات', error: err.message });
  }
});

// جلب كل الإنستراكتورز مع بروفايل كامل والكورسات
router.get('/instructors-with-courses', userController.getInstructorsWithCourses);

// حذف حساب المستخدم بنفسه
router.delete('/me', authMiddleware, userController.deleteMyAccount);

// تحديث بيانات حساب المستخدم (يدعم form-data لرفع صورة شخصية وصورة كارنيه)
router.put('/me', authMiddleware, upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'collegeId', maxCount: 1 }
]), userController.updateMyAccount);

module.exports = router;