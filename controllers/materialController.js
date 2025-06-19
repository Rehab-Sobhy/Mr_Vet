const Material = require('../models/Material');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

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

    // حفظ المسار المحلي للملف
    const fileUrl = `/uploads/${req.file.destination.split('/').pop()}/${req.file.filename}`;
    const fullPath = `${req.file.destination}/${req.file.filename}`;
    if (!fs.existsSync(fullPath)) {
      return res.status(500).json({ message: `❌ الملف لم يتم رفعه بشكل صحيح: ${fullPath}` });
    }

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

    const materials = await Material.find({ courseId });
    res.status(200).json({ materials });
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