const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary configuration:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'HIDDEN' : 'NOT SET',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType = 'raw';
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    console.log('Uploading file with params:', {
      folder: 'uploads',
      resource_type: resourceType,
      format: file.mimetype.split('/')[1],
      access_mode: 'public',
    });

    return {
      folder: 'uploads', // اسم المجلد العام في Cloudinary
      resource_type: resourceType, // تحديد نوع الملف ديناميكيًا
      format: file.mimetype.split('/')[1], // تحديد صيغة الملف بناءً على نوعه
      access_mode: 'public', // جعل الملفات عامة للوصول بدون مصادقة
    };
  },
});

const upload = multer({ storage });

module.exports = upload;