const User = require('../models/User');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Material = require('../models/Material');
const Subscription = require('../models/Subscription');
const Log = require('../models/Log');

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
    // إرسال بريد إلكتروني للمستخدم عند اعتماد الكارنيه
    const sendEmail = require('../utils/sendEmail');
    await sendEmail(
      user.email,
      'تم اعتماد الكارنيه',
      `مرحبًا ${user.name}،\n\nتم اعتماد الكارنيه الخاص بك بنجاح. يمكنك الآن الاستفادة من جميع خدمات المنصة.\n\nشكرًا لك!`
    );
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء الاعتماد', error: err.message });
  }
};

// جلب كل الاشتراكات مع بيانات الطالب والكورس
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('userId', 'name email phone')
      .populate('courseId', 'courseName price academicYear');
    res.status(200).json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب الاشتراكات', error: error.message });
  }
};

// إضافة اشتراك يدوي (studentId, courseId)
exports.addSubscription = async (req, res) => {
  try {
    const { studentId, courseId, startDate, endDate } = req.body;
    if (!studentId || !courseId || !startDate || !endDate) {
      return res.status(400).json({ message: 'studentId, courseId, startDate, endDate مطلوبة' });
    }
    // تحقق من عدم وجود اشتراك مكرر
    const exists = await Subscription.findOne({ userId: studentId, courseId });
    if (exists) {
      return res.status(400).json({ message: 'الطالب مشترك بالفعل في هذا الكورس' });
    }
    const subscription = await Subscription.create({
      userId: studentId,
      courseId,
      startDate,
      endDate,
      status: 'active'
    });
    // سجل العملية
    await Log.create({
      adminId: req.user._id,
      action: 'add_subscription',
      details: { studentId, courseId }
    });
    res.status(201).json({ message: 'تم إضافة الاشتراك بنجاح', subscription });
  } catch (error) {
    res.status(500).json({ message: 'فشل في إضافة الاشتراك', error: error.message });
  }
};

// حذف اشتراك طالب من كورس
exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findByIdAndDelete(id);
    if (!subscription) {
      return res.status(404).json({ message: 'الاشتراك غير موجود' });
    }
    // سجل العملية
    await Log.create({
      adminId: req.user._id,
      action: 'delete_subscription',
      details: { subscriptionId: id }
    });
    res.status(200).json({ message: 'تم حذف الاشتراك بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل في حذف الاشتراك', error: error.message });
  }
};

// جلب سجل النشاطات الإدارية
exports.getAdminLogs = async (req, res) => {
  try {
    const logs = await Log.find().populate('adminId', 'name email');
    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'فشل في جلب السجلات', error: error.message });
  }
};

// تعديل كورس (أدمن فقط)
exports.updateCourseByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const course = await Course.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ message: 'الكورس غير موجود' });
    }
    // سجل العملية
    await Log.create({
      adminId: req.user._id,
      action: 'update_course',
      details: { courseId: id, updates }
    });
    res.status(200).json({ message: 'تم تعديل الكورس بنجاح', course });
  } catch (error) {
    res.status(500).json({ message: 'فشل في تعديل الكورس', error: error.message });
  }
};

// حذف كورس (أدمن فقط)
exports.deleteCourseByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: 'الكورس غير موجود' });
    }
    // سجل العملية
    await Log.create({
      adminId: req.user._id,
      action: 'delete_course',
      details: { courseId: id }
    });
    res.status(200).json({ message: 'تم حذف الكورس بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'فشل في حذف الكورس', error: error.message });
  }
};

// ✅ تفعيل اشتراك طالب في كورس (email أو userId + courseId)
exports.activateSubscription = async (req, res) => {
  try {
    const { email, userId, courseId } = req.body;
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      return res.status(404).json({ msg: '❌ المستخدم غير موجود' });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: '❌ الكورس غير موجود' });
    }
    const existingSubscription = await Subscription.findOne({ userId: user._id, courseId });
    if (existingSubscription) {
      return res.status(400).json({ msg: '❌ الطالب مشترك بالفعل في هذا الكورس' });
    }
    const subscription = await Subscription.create({
      userId: user._id,
      courseId: course._id,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'active'
    });
    // إرسال بريد إلكتروني للطالب عند تفعيل الكورس
    const sendEmail = require('../utils/sendEmail');
    await sendEmail(
      user.email,
      'تم تفعيل الكورس',
      `مرحبًا ${user.name}،\n\nتم تفعيل الكورس "${course.courseName || course.title}" بنجاح. يمكنك الآن الوصول إلى محتوى الكورس.\n\nشكرًا لك!`
    );
    // سجل العملية
    await Log.create({
      adminId: req.user._id,
      action: 'activate_subscription',
      details: { userId: user._id, courseId: course._id }
    });
    res.status(201).json({ msg: '✅ تم تفعيل الكورس بنجاح', subscription });
  } catch (err) {
    console.error('❌ Error activating subscription:', err);
    res.status(500).json({ msg: '❌ حصلت مشكلة أثناء تفعيل الكورس', error: err.message });
  }
};