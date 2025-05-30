const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Middleware رفع الملفات

// ✅ جلب الكورسات الخاصة بـ Instructor معين
router.get(
  '/my-courses',
  authMiddleware,
  roleMiddleware(['instructor']),
  courseController.getInstructorCourses
);

// ✅ جلب كورس معين بالـ ID
router.get(
  '/:id',
  authMiddleware,
  courseController.getCourseById
);

// ✅ التحقق من اشتراك المستخدم في الكورس
router.get(
  '/:id/check-enrollment',
  authMiddleware,
  courseController.checkEnrollment
);

// ✅ حذف فيديو من كورس (للإنستركتور فقط)
router.delete(
  '/:courseId/videos/:videoId',
  authMiddleware,
  roleMiddleware(['admin', 'instructor']),
  courseController.deleteVideoFromCourse
);

// ✅ جلب كل الكورسات
router.get('/', courseController.getAllCourses);

// ✅ إنشاء كورس جديد
router.post(
  '/create',
  authMiddleware,
  roleMiddleware(['admin', 'instructor']),
  upload.fields([
    { name: 'courseImage', maxCount: 1 }, // رفع صورة الكورس
    { name: 'videos' }, // رفع فيديوهات الكورس بدون حد أقصى
  ]),
  courseController.createCourse
);

// ✅ تفعيل مستخدم في كورس (للأدمن والإنستركتور فقط)
router.post(
  '/:courseId/activate-user',
  authMiddleware,
  roleMiddleware(['admin']),
  courseController.activateUserInCourse
);

module.exports = router;
