const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

    return {
      folder: 'uploads', // اسم المجلد العام في Cloudinary
      resource_type: resourceType, // تحديد نوع الملف ديناميكيًا
      format: file.mimetype.split('/')[1], // تحديد صيغة الملف بناءً على نوعه
    };
  },
});

const upload = multer({ storage });

module.exports = upload;