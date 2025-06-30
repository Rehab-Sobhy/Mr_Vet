/// controllers/authController.js

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require('multer');
const path = require('path');
const crypto = require("crypto"); // ✅ مضافة من الكود التاني

// ✅ إنشاء توكن JWT
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "30d", // التوكن صالح لمدة 7 أيام
  });
};

// إعداد التخزين للصور (لم يعد مطلوبًا رفع صورة شخصية)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/profileImages'); // مسار حفظ الصور
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// التحقق من نوع الملف (لم يعد مطلوبًا رفع صورة شخصية)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('❌ نوع الملف غير مدعوم. يجب أن يكون صورة.'));
//   }
// };

const upload = multer({ /* storage, fileFilter */ });

exports.uploadMiddleware = upload.fields([
  // { name: 'profileImage', maxCount: 1 }, // تم حذف رفع صورة الملف الشخصي
  { name: 'collegeId', maxCount: 1 },
]);

// ✅ تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, academicYear } = req.body;

    // التحقق من البيانات
    if (!name || !email || !password || !role || !phone || !academicYear) {
      return res.status(400).json({ msg: "❌ كل الحقول مطلوبة (الاسم، الإيميل، كلمة المرور، الدور، رقم الهاتف، السنة الدراسية)" });
    }

    // التحقق إذا كان الإيميل أو رقم الهاتف مستخدم من قبل
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ msg: "❌ الإيميل أو رقم الهاتف مستخدم بالفعل" });
    }

    // التحقق من رفع صورة الكارنيه
    if (!req.files || !req.files['collegeId']) {
      return res.status(400).json({ msg: "❌ صورة الكارنيه مطلوبة" });
    }

    // التحقق من نوع وحجم وأبعاد صورة الكارنيه
    const carnetFile = req.files['collegeId'][0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(carnetFile.mimetype)) {
      return res.status(400).json({ msg: "❌ نوع صورة الكارنيه غير مدعوم (فقط jpg, jpeg, png)" });
    }
    if (carnetFile.size > 2 * 1024 * 1024) {
      return res.status(400).json({ msg: "❌ حجم صورة الكارنيه يجب ألا يتجاوز 2 ميجابايت" });
    }
    // يمكن إضافة فحص الأبعاد لاحقًا باستخدام مكتبة sharp أو jimp

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إعداد الصور
    // const profileImage = req.files['profileImage']
    //   ? req.files['profileImage'][0].path
    //   : null;
    const collegeId = carnetFile.path;

    // إنشاء المستخدم
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      academicYear,
      collegeId,
      carnetStatus: 'pending', // الحالة الافتراضية للكارنيه
    });

    // إنشاء التوكن
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("❌ Error during registration:", err);
    res.status(500).json({ msg: "❌ حصلت مشكلة أثناء التسجيل", error: err.message });
  }
};

// ✅ تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // التحقق من البيانات
    if (!email || !password) {
      return res.status(400).json({ msg: "❌ كل الحقول مطلوبة" });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: '❌ لا يوجد حساب بهذا البريد الإلكتروني، من فضلك سجل حساب جديد.' });
    }

    // مقارنة كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "❌ كلمة المرور غير صحيحة" });
    }

    // إنشاء التوكن
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ msg: "❌ حصلت مشكلة أثناء تسجيل الدخول", error: err.message });
  }
};

// ✅ نسيان كلمة السر
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: '❌ المستخدم غير موجود' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = Date.now() + 1000 * 60 * 15; // 15 دقيقة

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    // هنا يمكنك إرسال التوكن على الإيميل الحقيقي للمستخدم
   //  const resetLink = `https://your-frontend-url.com/reset-password?token=${resetToken}`;
    await sendEmail(user.email, 'Password Reset', `Use this link to reset your password: ${resetLink}`);

    res.status(200).json({ message: '✅ تم إرسال رابط إعادة التعيين على الإيميل', resetToken });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء إرسال كود إعادة التعيين', error: err.message });
  }
};

// ✅ إعادة تعيين كلمة السر
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: '❌ التوكن غير صالح أو منتهي' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: '✅ تم إعادة تعيين كلمة السر بنجاح' });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء إعادة تعيين كلمة السر', error: err.message });
  }
};

// تسجيل الخروج (لو بتستخدم JWT فقط، غالبًا يتم حذف التوكن من الفرونت فقط)
// لو عندك activeToken في User:
exports.logout = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { activeToken: null });
    res.status(200).json({ message: '✅ تم تسجيل الخروج بنجاح' });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء تسجيل الخروج', error: err.message });
  }
};

// ✅ تسجيل معلم جديد (Admin Only)
exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, academicYear } = req.body;
    // تحقق من الصلاحيات (يجب أن يكون الأدمن)
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: '❌ غير مصرح لك' });
    }
    if (!name || !email || !password || !phone || !academicYear) {
      return res.status(400).json({ message: '❌ كل الحقول مطلوبة' });
    }
    // تحقق من عدم وجود إيميل مكرر
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '❌ الإيميل مستخدم بالفعل' });
    }
    // تحقق من صحة رقم الهاتف (مصري)
    const egyptPhoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (!egyptPhoneRegex.test(phone)) {
      return res.status(400).json({ message: '❌ رقم الهاتف غير صحيح' });
    }
    // تشفير كلمة السر
    const hashedPassword = await bcrypt.hash(password, 10);
    // إنشاء المعلم
    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      academicYear,
      role: 'teacher'
      // profileImage: req.file ? req.file.path : undefined // تم حذف صورة الملف الشخصي
    });
    res.status(201).json({ message: '✅ تم إنشاء حساب المعلم بنجاح', teacher });
  } catch (error) {
    res.status(500).json({ message: '❌ فشل في إنشاء حساب المعلم', error: error.message });
  }
};

// ✅ رفض الكارنيه (أدمن فقط)
exports.rejectCarnet = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: '❌ userId مطلوب' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { carnetStatus: 'rejected' },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: '❌ المستخدم غير موجود' });
    }
    res.status(200).json({ message: '✅ تم رفض الكارنيه بنجاح', user });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء الرفض', error: err.message });
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
