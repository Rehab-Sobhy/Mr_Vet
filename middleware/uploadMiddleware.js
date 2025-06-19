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

const upload = multer({ storage });

module.exports = upload;