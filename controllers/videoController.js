const Video = require('../models/Video');
const Course = require('../models/Course'); // استيراد نموذج الكورس
// ✅ إضافة فيديو جديد مربوط بكورس
const addVideo = async (req, res) => {
  try {
    const { title, courseId } = req.body;

    // التحقق من البيانات
    if (!title || !courseId) {
      return res.status(400).json({ message: '❌ كل الحقول مطلوبة!' });
    }

    // التحقق من رفع الفيديو
    if (!req.file) {
      return res.status(400).json({ message: '❌ لازم ترفع فيديو!' });
    }

    // ✅ التحقق من نوع الملف
    if (!req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({ message: '❌ لازم ترفع ملف فيديو فقط!' });
    }

    // ✅ التحقق من وجود الكورس
    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: '❌ الكورس غير موجود!' });

    // إنشاء الفيديو
    const video = new Video({
      title,
      videoPath: req.file.path, // مسار الفيديو المرفوع
      courseId,
    });

    await video.save();
    res.status(201).json({ message: '✅ تم إضافة الفيديو بنجاح!', video });
  } catch (error) { // ✅ معالجة أخطاء حفظ الملف وقاعدة البيانات بشكل منفصل
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

    // جلب الفيديوهات المرتبطة بالكورس
    const videos = await Video.find({ courseId });
    res.status(200).json({ message: '✅ تم جلب الفيديوهات بنجاح!', videos });
  } catch (error) {
    console.error('❌ Error fetching videos by course:', error);
    res.status(500).json({ message: '❌ فشل في جلب الفيديوهات', error: error.message });
  }
};

module.exports = { addVideo, getVideosByCourse };
