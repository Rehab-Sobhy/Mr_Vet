const Material = require('../models/Material');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const path = require('path');

exports.uploadMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

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

    // استخدام رابط Cloudinary كـ File URL
    const fileUrl = req.file.path;

    const material = await Material.create({
      courseId,
      fileUrl,
      fileType: req.file.mimetype,
      title,
      description,
    });

    res.status(201).json({ message: '✅ تم رفع الملف بنجاح', material });
  } catch (error) {
    res.status(500).json({ message: '❌ فشل في رفع الملف', error: error.message });
  }
};

exports.getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: '❌ معرف الكورس غير صالح' });
    }

    // جلب المواد مع تعديل الروابط لتكون inline
    const materials = await Material.find({ courseId }).select('fileUrl title description');

    const updatedMaterials = materials.map((material) => {
      return {
        ...material._doc,
        fileUrl: `${material.fileUrl}?content-disposition=inline`,
      };
    });

    res.status(200).json({ materials: updatedMaterials });
  } catch (error) {
    res.status(500).json({ message: '❌ فشل في جلب المواد', error: error.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({ message: '❌ معرف المادة غير صالح' });
    }
    const material = await Material.findByIdAndDelete(materialId);
    if (!material) {
      return res.status(404).json({ message: '❌ المادة غير موجودة' });
    }
    res.status(200).json({ message: '✅ تم حذف المادة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: '❌ فشل في حذف المادة', error: error.message });
  }
};