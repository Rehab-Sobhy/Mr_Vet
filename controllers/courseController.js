const Course = require('../models/Course');
const User = require('../models/User');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
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

    // 1. أنشئ الكورس أولاً بدون فيديوهات
    const course = new Course({
      title,
      description,
      price,
      category,
      courseImage,
      videos: [],
      instructor: req.user._id,
    });
    await course.save();

    // 2. أنشئ الفيديوهات واربطها بالكورس
    const videoIds = [];
    if (req.files['videos']) {
      for (const file of req.files['videos']) {
        const video = new Video({
          title: file.originalname,
          videoPath: file.path,
          courseId: course._id // هنا بنحط الـ id الصحيح
        });
        await video.save();
        videoIds.push(video._id);
      }
    }

    // 3. حدث الكورس وضيف الفيديوهات
    course.videos = videoIds;
    await course.save();

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

// ✅ حذف فيديو من كورس (للإنستركتور فقط)
exports.deleteVideoFromCourse = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: '❌ الكورس غير موجود' });

    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: '❌ غير مصرح لك' });
    }

    course.videos = course.videos.filter(id => id.toString() !== videoId);
    await course.save();

    await Video.findByIdAndDelete(videoId);

    res.status(200).json({ message: '✅ تم حذف الفيديو من الكورس بنجاح' });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء حذف الفيديو', error: err.message });
  }
};

// ✅ تفعيل مستخدم في كورس
exports.activateUserInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: '❌ المستخدم غير موجود' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: '❌ الكورس غير موجود' });

    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    const exists = await Subscription.findOne({ userId, courseId, status: 'active' });
    if (!exists) {
      await Subscription.create({
        userId,
        courseId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // شهر من الآن
        status: 'active'
      });
    }

    res.status(200).json({ message: '✅ تم تفعيل الطالب في الكورس وتسجيل الاشتراك بنجاح' });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء التفعيل', error: err.message });
  }
};

// ✅ تحديث بيانات الكورس
// Option 1: Use set() and save() (as above)
// Option 2: Use findByIdAndUpdate
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'title', 'description', 'price', 'instructor', 'category',
      'courseImage', 'videos', 'subjects'
    ];
    const updateFields = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateFields[field] = req.body[field];
    });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: '❌ الكورس غير موجود' });

    // السماح فقط للإنستراكتور صاحب الكورس أو الأدمن
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: '❌ غير مصرح لك بتعديل هذا الكورس' });
    }

    Object.assign(course, updateFields);
    await course.save();

    res.status(200).json({ message: '✅ تم تعديل الكورس بنجاح', course });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء التعديل', error: err.message });
  }
};

// ✅ حذف كورس
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: '❌ الكورس غير موجود' });

    // السماح فقط للإنستراكتور صاحب الكورس أو الأدمن
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: '❌ غير مصرح لك بحذف هذا الكورس' });
    }

    await course.deleteOne();
    res.status(200).json({ message: '✅ تم حذف الكورس بنجاح' });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء الحذف', error: err.message });
  }
};

// ✅ إضافة مادة دراسية لكورس
exports.addSubjectToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { subject } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: '❌ الكورس غير موجود' });

    course.subjects.push(subject);
    await course.save();

    res.status(200).json({ message: '✅ تم إضافة المادة', course });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء الإضافة', error: err.message });
  }
};