const mongoose = require('mongoose');
const Video = require('../models/Video');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const settingsController = require('../controllers/settingsController');

// ✅ إضافة فيديو جديد مربوط بكورس
const addVideo = async (req, res) => {
  try {
    console.log('Request Body:', req.body); // Logging عشان نشوف إيه اللي بيتبعت
    console.log('Request File:', req.file);

    const { title, courseId, order, course } = req.body;

    // التحقق من البيانات الأساسية
    if (!title || !courseId) {
      return res.status(400).json({ message: '❌ كل الحقول الأساسية مطلوبة (العنوان، معرف الكورس)!' });
    }

    // التحقق من رفع الفيديو
    if (!req.file) {
      return res.status(400).json({ message: '❌ لازم ترفع فيديو!' });
    }

    // ✅ التحقق من نوع الملف
    if (!req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({ message: '❌ لازم ترفع ملف فيديو فقط!' });
    }

    // التحقق من صلاحية courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: '❌ معرف الكورس غير صالح!' });
    }

    // ✅ التحقق من وجود الكورس
    const courseDoc = await Course.findById(courseId);
    if (!courseDoc) {
      return res.status(404).json({ message: '❌ الكورس غير موجود!' });
    }

    // ✅ التحقق من إن الـ instructor هو صاحب الكورس
    if (courseDoc.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '❌ غير مصرح لك بإضافة فيديوهات لهذا الكورس!' });
    }

    // إنشاء الفيديو مع تعديل مسار الفيديو ليكون رابط URL نسبي
    const video = new Video({
      title,
      videoPath: `/uploads/videos/${req.file.filename}`,  // هنا التعديل المهم
      courseId,
      order: order || 1, // قيمة افتراضية لو الحقل مش موجود
      course: course || 'غير محدد', // قيمة افتراضية
      instructorId: req.user._id, // إضافة معرف الـ instructor
    });

    await video.save();
    res.status(201).json({ message: '✅ تم إضافة الفيديو بنجاح!', video });
  } catch (error) {
    console.error('❌ Error adding video:', error);
    res.status(400).json({ message: '❌ فشل في إضافة الفيديو', error: error.message });
  }
};

// ✅ جلب الفيديوهات الخاصة بكورس معين
const getVideosByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // التحقق من وجود معرف الكورس
    if (!courseId) {
      return res.status(400).json({ message: '❌ معرف الكورس مطلوب!' });
    }

    // التحقق من صلاحية courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: '❌ معرف الكورس غير صالح!' });
    }

    // جلب الفيديوهات المرتبطة بالكورس
    const videos = await Video.find({ courseId });
    res.status(200).json({ message: '✅ تم جلب الفيديوهات بنجاح!', videos });
  } catch (error) {
    console.error('❌ Error fetching videos by course:', error);
    res.status(500).json({ message: '❌ فشل في جلب الفيديوهات', error: error.message });
  }
};



module.exports = { addVideo, getVideosByCourse };
