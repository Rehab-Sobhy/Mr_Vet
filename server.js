// استدعاء مكتبة إكسبريس لتشغيل السيرفر
const express = require('express');
const app = express();
// استدعاء مكتبة Mongoose لربط التطبيق مع MongoDB
const mongoose = require('mongoose');
// تحميل متغيرات البيئة من ملف .env
require('dotenv').config();
// استدعاء مكتبة cors
const cors = require('cors');
// استدعاء مكتبة helmet لتعزيز أمان التطبيق
const helmet = require('helmet');
const fs = require('fs');

// تفعيل CORS مع السماح للداشبورد وأي دومين آخر (ويب أو موبايل)
app.use(cors({
  origin: function (origin, callback) {
    // السماح للداشبورد بشكل صريح وأي origin آخر (للموبايل وغيره)
    const dashboard = 'https://manegmentvett-zeta.vercel.app';
    if (!origin || origin === dashboard) {
      return callback(null, true);
    }
    // السماح لأي origin آخر (موبايل وغيره)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'Origin', 'Accept'],
}));
// تفعيل Helmet
app.use(helmet());

// استدعاء الملفات الخاصة بالمسارات
const userRoutes = require('./routes/userRoute');
const courseRoutes = require('./routes/courseRoutes');
const videoRoutes = require('./routes/videoRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const playerRoutes = require('./routes/playerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const materialRoutes = require('./routes/materialRoutes');
const authRoutes = require('./routes/authRoute'); // ✅ استدعاء مسار المصادقة

// استدعاء Middleware لمعالجة الأخطاء
const errorMiddleware = require('./middleware/errorHandler');

// تمكين استقبال البيانات بصيغة JSON من الطلبات
app.use(express.json());

// ✅ الاتصال بقاعدة البيانات MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // إذا لم يتم الاتصال خلال 5 ثوانٍ، يتم الإنهاء
            family: 4 // يجبر الاتصال على استخدام IPv4 بدلًا من IPv6
        });

        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1); // إنهاء التطبيق إذا فشل الاتصال
    }
};

// تنفيذ الاتصال بقاعدة البيانات
connectDB();

// تمكين خدمة الملفات الثابتة (Static) لملفات الرفع
app.use('/uploads', express.static('uploads'));

// Middleware لخدمة ملفات PDF مع تعيين Content-Type
app.use('/uploads/pdfs', (req, res, next) => {
  res.setHeader('Content-Type', 'application/pdf');
  next();
});

// ✅ إعداد المسارات
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes); // مسارات الكورسات
app.use('/api/videos', videoRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', authMiddleware, adminRoutes); // مسارات الإدارة
app.use('/api/materials', materialRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes); // ✅ تم تصحيح المسار

// Middleware لمعالجة الأخطاء
app.use(errorMiddleware);

// إنشاء جميع مجلدات الرفع تلقائيًا عند تشغيل السيرفر
['uploads', 'uploads/images', 'uploads/videos', 'uploads/pdfs', 'uploads/others'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

//Eng-Amglous Rezq
// 🕊️ مزمور 27:1 🕊️
// "ٱلرَّبُّ نُورِي وَخَلَاصِي، مِمَّنْ أَخَافُ؟ ٱلرَّبُّ حِصْنُ حَيَاتِي، مِمَّنْ أَرْتَعِبُ؟"
