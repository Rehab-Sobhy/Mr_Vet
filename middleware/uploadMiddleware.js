const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureFolderExists = (folder) => {
  if (!fs.existsSync(folder)) {
    console.log(`Creating folder: ${folder}`); // Logging
    fs.mkdirSync(folder, { recursive: true });
  } else {
    console.log(`Folder exists: ${folder}`); // Logging
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder;
    if (file.mimetype.startsWith('video')) {
      folder = 'uploads/videos';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'uploads/pdfs';
    } else if (file.mimetype.startsWith('image')) {
      folder = 'uploads/images';
    } else {
      return cb(new Error('❌ نوع الملف غير مدعوم!'), false);
    }

    ensureFolderExists(folder);
    console.log(`Saving file to: ${folder}`); // Logging
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    console.log(`File name: ${uniqueName}`); // Logging
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('❌ نوع الملف غير مدعوم!'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;