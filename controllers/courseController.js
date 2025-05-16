const Course = require('../models/Course');
const User = require('../models/User');
const Video = require('../models/Video');

// ✅ جلب كل الكورسات
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('videos');
    res.status(200).json(courses);
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    res.status(500).json({ error: '❌ حدث خطأ أثناء جلب الكورسات' });
  }
};

// ✅ جلب كورس معين بالـ ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('videos');
    if (!course) {
      return res.status(404).json({ error: '❌ الكورس غير موجود' });
    }
    res.status(200).json(course);
  } catch (err) {
    console.error("❌ Error fetching course by ID:", err);
    res.status(500).json({ error: '❌ حدث خطأ أثناء جلب الكورس' });
  }
};

// ✅ جلب الكورسات الخاصة بـ Instructor معين
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user._id; // جلب ID المدرس من التوكن
    const courses = await Course.find({ instructor: instructorId }).populate('videos');

    res.status(200).json({ message: '✅ تم جلب الكورسات بنجاح', courses });
  } catch (err) {
    console.error("❌ Error fetching instructor's courses:", err);
    res.status(500).json({ error: '❌ حدث خطأ أثناء جلب الكورسات' });
  }
};

// ✅ إنشاء كورس جديد مع رفع صورة وفيديوهات
exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    if (!title || !description || !price || !category) {
      return res.status(400).json({ error: '❌ يرجى ملء جميع الحقول المطلوبة: title, description, price, category' });
    }

    const courseImage = req.files['courseImage'] ? req.files['courseImage'][0].path : null;
    const videoIds = [];

    if (req.files['videos']) {
      for (const file of req.files['videos']) {
        const video = new Video({
          title: file.originalname,
          videoPath: file.path,
          courseId: null // سيتم تحديثه بعد إنشاء الكورس
        });
        await video.save();
        videoIds.push(video._id);
      }
    }

    const course = new Course({
      title,
      description,
      price,
      category,
      courseImage,
      videos: videoIds,
      instructor: req.user._id,
    });

    await course.save();

    // تحديث courseId في الفيديوهات
    await Video.updateMany({ _id: { $in: videoIds } }, { courseId: course._id });

    res.status(201).json({ message: '✅ تم إنشاء الكورس بنجاح!', course });
  } catch (err) {
    console.error("❌ Error creating course:", err);
    res.status(500).json({ error: `❌ حدث خطأ أثناء إنشاء الكورس: ${err.message}` });
  }
};

// ✅ التحقق من اشتراك المستخدم في الكورس
exports.checkEnrollment = async (req, res) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.id;

    const user = await User.findById(userId);
    const isEnrolled = user.enrolledCourses.includes(courseId);

    if (isEnrolled) {
      const course = await Course.findById(courseId).populate('videos');
      return res.status(200).json({
        message: '✅ أنت مشترك بالفعل في هذا الكورس!',
        course,
      });
    } else {
      return res.status(403).json({
        message: '❌ يجب الاشتراك في الكورس للوصول إلى المحتوى.',
      });
    }
  } catch (err) {
    console.error('❌ Error checking enrollment:', err);
    res.status(500).json({ error: '❌ حدث خطأ أثناء التحقق من الاشتراك.' });
  }
};