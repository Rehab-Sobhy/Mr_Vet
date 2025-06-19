require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// رفع ملف يدويًا
cloudinary.uploader.upload('E:/cv Angelo.pdf', { folder: 'uploads' }, (error, result) => {
  if (error) {
    console.error('❌ فشل في رفع الملف:', error);
  } else {
    console.log('✅ تم رفع الملف بنجاح:', result);
  }
});
