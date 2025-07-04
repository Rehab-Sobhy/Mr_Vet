const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إعداد التخزين المحلي بناءً على نوع الملف
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = 'uploads/others';
    if (file.mimetype.startsWith('image/')) {
      dest = 'uploads/images';
    } else if (file.mimetype.startsWith('video/')) {
      dest = 'uploads/videos';
    } else if (file.mimetype === 'application/pdf') {
      dest = 'uploads/pdfs';
    }
    // إنشاء المجلد إذا لم يكن موجودًا
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// إضافة فلاتر وحدود للملفات (حجم ونوع)
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    console.log('🟢 [uploadMiddleware] field:', file.fieldname, '| mimetype:', file.mimetype);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (file.fieldname === 'collegeId' && !allowedTypes.includes(file.mimetype)) {
      console.log('🔴 [uploadMiddleware] نوع الملف غير مدعوم:', file.mimetype);
      return cb(new Error('❌ نوع صورة الكارنيه غير مدعوم (فقط jpg, jpeg, png)'), false);
    }
    cb(null, true);
  }
});

module.exports = upload;