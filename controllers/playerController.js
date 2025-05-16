const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');

// ✅ تشغيل الفيديو (stream)
exports.streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: '❌ الفيديو غير موجود' });
    }

    const videoPath = path.resolve(video.videoPath);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: '❌ ملف الفيديو غير موجود على السيرفر' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('❌ Error streaming video:', error);
    res.status(500).json({ message: '❌ فشل في تشغيل الفيديو', error: error.message });
  }
};

// ✅ تحميل الفيديو
exports.downloadVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: '❌ الفيديو غير موجود' });
    }

    const videoPath = path.resolve(video.videoPath);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: '❌ ملف الفيديو غير موجود على السيرفر' });
    }

    res.download(videoPath, (err) => {
      if (err) {
        console.error('❌ Error downloading video:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: '❌ فشل في تحميل الفيديو', error: err.message });
        }
      }
    });
  } catch (error) {
    console.error('❌ Error downloading video:', error);
    res.status(500).json({ message: '❌ فشل في تحميل الفيديو', error: error.message });
  }
};