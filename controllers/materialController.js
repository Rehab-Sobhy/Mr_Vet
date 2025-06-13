const Material = require('../models/Material');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// ✅ رفع ملف PDF/ZIP
exports.uploadMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    // تحقق من صحة الـ ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: '❌ معرف الكورس غير صالح' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: '❌ الكورس غير موجود' });
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: '❌ غير مصرح لك برفع ملفات لهذا الكورس' });
    }
    if (!req.file) {
      return res.status(400).json({ message: '❌ يجب رفع ملف' });
    }
    const material = await Material.create({
      courseId,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      title,
      description,
    });
    res.status(201).json({ message: '✅ تم رفع الملف بنجاح', material });
  } catch (error) {
    res.status(500).json({ message: '❌ فشل في رفع الملف', error: error.message });
  }
};