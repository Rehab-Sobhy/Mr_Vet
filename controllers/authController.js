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

// إعداد التخزين للصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profileImages'); // مسار حفظ الصور
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// التحقق من نوع الملف
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('❌ نوع الملف غير مدعوم. يجب أن يكون صورة.'));
  }
};

const upload = multer({ storage, fileFilter });

exports.uploadMiddleware = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'collegeId', maxCount: 1 },
]);

// ✅ تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // التحقق من البيانات
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "❌ كل الحقول مطلوبة" });
    }

    // التحقق إذا كان الإيميل مستخدم قبل كده
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "❌ الإيميل مستخدم بالفعل" });
    }

    // التحقق من رفع صورة الكارنيه
    if (!req.files || !req.files['collegeId']) {
      return res.status(400).json({ msg: "❌ صورة الكارنيه مطلوبة" });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إعداد الصور
    const profileImage = req.files['profileImage']
      ? req.files['profileImage'][0].path
      : null;
    const collegeId = req.files['collegeId'][0].path;

    // إنشاء المستخدم
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      profileImage,
      collegeId,
    });

    // إنشاء التوكن
    const token = generateToken(user._id, user.role);

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
    const token = generateToken(user._id, user.role);

    res.status(200).json({ token, user });
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
