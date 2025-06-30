const User = require('../models/User');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Material = require('../models/Material');

// ✅ عرض كل المستخدمين
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({ message: '✅ تم جلب المستخدمين بنجاح', users });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: '❌ فشل في جلب المستخدمين', error: error.message });
  }
};

// ✅ تعديل بيانات مستخدم
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ message: '❌ المستخدم غير موجود' });
    }

    res.status(200).json({ message: '✅ تم تعديل بيانات المستخدم بنجاح', user });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: '❌ فشل في تعديل بيانات المستخدم', error: error.message });
  }
};

// ✅ حذف مستخدم
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // التحقق من وجود المستخدم
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: '❌ المستخدم غير موجود' });
    }

    res.status(200).json({ message: '✅ تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ message: '❌ فشل في حذف المستخدم', error: error.message });
  }
};

// ✅ رفع الملفات (صور أو فيديوهات)
exports.uploadFile = (req, res) => {
  try {
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: '❌ لم يتم رفع أي ملفات' });
    }

    const uploadedFiles = {};
    if (files.thumbnail) {
      uploadedFiles.thumbnail = files.thumbnail[0].path;
    }
    if (files.video) {
      uploadedFiles.video = files.video[0].path;
    }

    res.status(200).json({ message: '✅ تم رفع الملفات بنجاح', files: uploadedFiles });
  } catch (error) {
    console.error('❌ Error uploading files:', error);
    res.status(500).json({ message: '❌ فشل في رفع الملفات', error: error.message });
  }
};

// ✅ جلب إحصائيات عامة للوحة تحكم الأدمن
exports.getStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const coursesCount = await Course.countDocuments();
    const videosCount = await Video.countDocuments();
    const materialsCount = await Material.countDocuments();
    res.status(200).json({
      usersCount,
      coursesCount,
      videosCount,
      materialsCount
    });
  } catch (error) {
    res.status(500).json({ message: '❌ فشل في جلب الإحصائيات', error: error.message });
  }
};

// ✅ إنشاء حساب معلم (أدمن فقط)
exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, academicYear } = req.body;
    if (!name || !email || !password || !phone || !academicYear) {
      return res.status(400).json({ msg: '❌ كل الحقول مطلوبة (name, email, password, phone, academicYear)' });
    }
    // تحقق من عدم وجود إيميل أو رقم هاتف مكرر
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ msg: '❌ الإيميل أو رقم الهاتف مستخدم بالفعل' });
    }
    const hashedPassword = await require('bcryptjs').hash(password, 10);
    // دعم رفع صورة المعلم (اختياري)
    let profileImagePath = null;
    if (req.files && req.files['profileImage'] && req.files['profileImage'][0]) {
      profileImagePath = req.files['profileImage'][0].path;
    }
    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
      phone,
      academicYear,
      profileImage: profileImagePath,
      carnetStatus: 'approved'
    });
    res.status(201).json({ msg: '✅ تم إنشاء حساب المعلم بنجاح', teacher });
  } catch (err) {
    res.status(500).json({ msg: '❌ حدث خطأ أثناء إنشاء حساب المعلم', error: err.message });
  }
};

// ✅ اعتماد الكارنيه (أدمن فقط)
exports.approveCarnet = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: '❌ userId مطلوب' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { carnetStatus: 'approved' },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: '❌ المستخدم غير موجود' });
    }
    res.status(200).json({ message: '✅ تم اعتماد الكارنيه بنجاح', user });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء الاعتماد', error: err.message });
  }
};