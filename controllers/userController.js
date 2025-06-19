// controllers/userController.js

const User = require("../models/User");
const Course = require("../models/Course");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ جلب كل المستخدمين (للأدمن فقط)
exports.getAllUsers = async (req, res) => {
  try {
    // جلب كل المستخدمين مع استبعاد كلمة المرور
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ msg: "❌ فشل في تحميل المستخدمين", error: err.message });
  }
};

// ✅ جلب كل أسماء المحاضرين
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' }).select('name email');
    res.status(200).json({ instructors });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء جلب المحاضرين', error: err.message });
  }
};

// ✅ تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, profileImage } = req.body;

    // التحقق من البيانات
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: '❌ كل الحقول مطلوبة' });
    }

    // التحقق إذا كان الإيميل مستخدم مسبقًا
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: '❌ الإيميل مستخدم بالفعل' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم
    const user = await User.create({ name, email, password: hashedPassword, role, profileImage });

    // إنشاء التوكن
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('❌ Error during registration:', err);
    res.status(500).json({ msg: '❌ حصلت مشكلة أثناء التسجيل', error: err.message });
  }
};

// ✅ رفع صورة الملف الشخصي (تم التصحيح هنا)
exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ msg: '❌ يجب رفع صورة' });
    }

    // حفظ المسار المحلي للصورة
    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: `/uploads/images/${req.file.filename}` },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ msg: '❌ المستخدم غير موجود' });
    }

    res.status(200).json({ msg: '✅ تم رفع الصورة بنجاح', user });
  } catch (err) {
    console.error('❌ Error uploading profile image:', err);
    res.status(500).json({ msg: '❌ حصلت مشكلة أثناء رفع الصورة', error: err.message });
  }
};

// ✅ تحديث بيانات مستخدم (للأدمن أو المستخدم نفسه)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من وجود معرف المستخدم
    if (!id) {
      return res.status(400).json({ msg: "❌ معرف المستخدم مطلوب" });
    }

    // السماح للأدمن أو المستخدم نفسه فقط
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ msg: "❌ غير مصرح لك بتعديل هذا المستخدم" });
    }

    // تحديث بيانات المستخدم
    const updated = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).select("-password");
    if (!updated) {
      return res.status(404).json({ msg: "❌ المستخدم غير موجود" });
    }

    res.status(200).json({ msg: "✅ تم تحديث بيانات المستخدم بنجاح", updated });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ msg: "❌ فشل في تحديث البيانات", error: err.message });
  }
};

// ✅ حذف مستخدم (للأدمن فقط)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ msg: "❌ المستخدم غير موجود" });
    }
    res.status(200).json({ msg: "✅ تم حذف المستخدم بنجاح" });
  } catch (err) {
    res.status(500).json({ msg: "❌ فشل في الحذف", error: err.message });
  }
};

// ✅ جلب المحاضرين مع الكورسات (بروفايل كامل)
exports.getInstructorsWithCourses = async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .select('-password') // كل بيانات البروفايل ما عدا الباسورد
      .lean();

    const results = await Promise.all(
      instructors.map(async (inst) => {
        const courses = await Course.find({ instructor: inst._id }).select('-__v');
        return { ...inst, courses };
      })
    );

    res.status(200).json({ instructors: results });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء جلب المحاضرين مع الكورسات', error: err.message });
  }
};

// حذف حساب المستخدم بنفسه
exports.deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return res.status(404).json({ msg: "❌ المستخدم غير موجود أو تم حذفه بالفعل" });
    }
    // يمكنك هنا حذف بيانات مرتبطة أخرى لو أردت (مثلاً كورسات، ملفات...)
    res.status(200).json({ msg: "✅ تم حذف الحساب بنجاح" });
  } catch (err) {
    res.status(500).json({ msg: "❌ فشل في حذف الحساب", error: err.message });
  }
};

// تحديث حساب المستخدم بنفسه
exports.updateMyAccount = async (req, res) => {
  try {
    // جمع البيانات من body
    const updates = req.body ? { ...req.body } : {};

    // إذا تم رفع صور
    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        updates.profileImage = req.files.profileImage[0].path.replace(/\\/g, '/');
      }
      if (req.files.collegeId && req.files.collegeId[0]) {
        updates.collegeId = req.files.collegeId[0].path.replace(/\\/g, '/');
      }
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: '❌ لا يوجد بيانات لتحديثها' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ msg: '❌ المستخدم غير موجود' });
    }
    res.status(200).json({ msg: '✅ تم تحديث الحساب بنجاح', user });
  } catch (err) {
    res.status(500).json({ msg: '❌ فشل في تحديث الحساب', error: err.message });
  }
};