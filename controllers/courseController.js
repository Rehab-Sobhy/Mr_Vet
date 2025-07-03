const Course = require('../models/Course');
const User = require('../models/User');
const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
// ✅ جلب كل الكورسات
exports.getAllCourses = async (req, res) => {
  try {
    // دعم الفلترة حسب التصنيف (category) إذا تم تمريره في الكويري
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const courses = await Course.find(filter);
    res.status(200).json(courses);
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    res.status(500).json({ error: '❌ حدث خطأ أثناء جلب الكورسات' });
  }
};

// ✅ جلب كورس معين بالـ ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
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
    let filter = {};
    if (req.user.role === 'admin') {
      // إذا أدمن: يمكنه جلب كورسات أي معلم عبر كويري ?id=... أو ?name=...
      if (req.query.id) {
        filter.instructor = req.query.id;
      } else if (req.query.name) {
        filter.instructorName = req.query.name;
      } else {
        return res.status(400).json({ message: 'يرجى تحديد id أو name للمعلم في الكويري ?id=... أو ?name=...' });
      }
    } else if (req.user.role === 'teacher') {
      filter.instructor = req.user._id;
    } else {
      return res.status(403).json({ message: '❌ غير مصرح لك' });
    }
    const courses = await Course.find(filter); // لا يوجد videos مباشرة في الكورس، الفيديوهات داخل السكاشن
    res.status(200).json({ message: '✅ تم جلب الكورسات بنجاح', courses });
  } catch (err) {
    console.error("❌ Error fetching instructor's courses:", err);
    res.status(500).json({ error: '❌ حدث خطأ أثناء جلب الكورسات' });
  }
};

// ✅ إنشاء كورس جديد مع رفع صورة وفيديوهات
exports.createCourse = async (req, res) => {
  try {
    const { courseName, price, instructorName, academicYear, category, sections } = req.body;
    if (!courseName || !price || !instructorName || !academicYear || !category) {
      return res.status(400).json({ error: '❌ يرجى ملء جميع الحقول المطلوبة: courseName, price, instructorName, academicYear, category' });
    }
    const coverImage = req.files && req.files['courseImage'] ? req.files['courseImage'][0].path : undefined;
    let parsedSections = [];
    if (sections) {
      try {
        parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
      } catch (e) {
        return res.status(400).json({ error: '❌ sections يجب أن تكون Array أو JSON صحيح' });
      }
    }
    const course = new Course({
      courseName,
      price,
      instructor: req.user._id,
      instructorName,
      academicYear,
      category,
      coverImage,
      sections: parsedSections
    });
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
    const { courseId } = req.params;
    const updates = {};

    // تحديث الحقول الجديدة حسب الموديل
    if (req.body.courseName) updates.courseName = req.body.courseName;
    if (req.body.price) updates.price = req.body.price;
    if (req.body.instructorName) updates.instructorName = req.body.instructorName;
    if (req.body.academicYear) updates.academicYear = req.body.academicYear;
    if (req.body.category) updates.category = req.body.category;

    // تحديث sections إذا تم إرسالها (كـ JSON أو Array)
    if (req.body.sections) {
      try {
        updates.sections = typeof req.body.sections === 'string' ? JSON.parse(req.body.sections) : req.body.sections;
      } catch (e) {
        return res.status(400).json({ msg: '❌ sections يجب أن تكون Array أو JSON صحيح' });
      }
    }

    // لو فيه صورة جديدة
    if (req.file) {
      updates.coverImage = req.file.path;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: '❌ لا يوجد بيانات لتحديثها' });
    }

    const course = await Course.findByIdAndUpdate(courseId, updates, { new: true });
    if (!course) {
      return res.status(404).json({ msg: '❌ الكورس غير موجود' });
    }
    res.status(200).json({ msg: '✅ تم تحديث الكورس بنجاح', course });
  } catch (err) {
    res.status(500).json({ msg: '❌ فشل في تحديث الكورس', error: err.message });
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

// ✅ رفع كورس جديد بالهيكلية الجديدة
exports.uploadCourse = async (req, res) => {
  try {
    const { courseName, price, instructorName, academicYear, category, sections } = req.body;
    if (!courseName || !price || !instructorName || !academicYear || !category) {
      return res.status(400).json({ msg: '❌ كل الحقول مطلوبة (courseName, price, instructorName, academicYear, category)' });
    }
    let coverImage = null;
    if (req.files && req.files['coverImage']) {
      const img = req.files['coverImage'][0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(img.mimetype)) {
        return res.status(400).json({ msg: '❌ نوع صورة الغلاف غير مدعوم (jpg, jpeg, png فقط)' });
      }
      if (img.size > 2 * 1024 * 1024) {
        return res.status(400).json({ msg: '❌ حجم صورة الغلاف يجب ألا يتجاوز 2 ميجابايت' });
      }
      coverImage = img.path;
    }
    let parsedSections = [];
    if (sections) {
      try {
        parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
      } catch (e) {
        return res.status(400).json({ msg: '❌ sections يجب أن تكون Array أو JSON صحيح' });
      }
    }
    const course = await Course.create({
      courseName,
      price,
      instructor: req.user._id,
      instructorName,
      academicYear,
      category,
      coverImage,
      sections: parsedSections
    });
    res.status(201).json({ msg: '✅ تم رفع الكورس بنجاح', course });
  } catch (err) {
    res.status(500).json({ msg: '❌ حدث خطأ أثناء رفع الكورس', error: err.message });
  }
};

// ✅ إضافة سيكشن جديد لكورس
exports.addSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionType, sectionTitle, videos } = req.body;
    if (!sectionType || !sectionTitle) {
      return res.status(400).json({ msg: '❌ كل الحقول مطلوبة (sectionType, sectionTitle)' });
    }
    let parsedVideos = [];
    if (videos) {
      try {
        parsedVideos = JSON.parse(videos);
      } catch (e) {
        return res.status(400).json({ msg: '❌ videos يجب أن تكون JSON' });
      }
    }
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ msg: '❌ الكورس غير موجود' });
    course.sections.push({ sectionType, sectionTitle, videos: parsedVideos });
    await course.save();
    res.status(200).json({ msg: '✅ تم إضافة السيكشن بنجاح', course });
  } catch (err) {
    res.status(500).json({ msg: '❌ حدث خطأ أثناء إضافة السيكشن', error: err.message });
  }
};

// ✅ فلترة الكورسات حسب السنة الدراسية
exports.filterByYear = async (req, res) => {
  try {
    const { year, category } = req.query;
    if (!year) return res.status(400).json({ msg: '❌ السنة الدراسية مطلوبة' });
    const filter = { academicYear: Number(year) };
    if (category) filter.category = category;
    const courses = await Course.find(filter);
    res.status(200).json({ msg: '✅ تم جلب الكورسات بنجاح', courses });
  } catch (err) {
    res.status(500).json({ msg: '❌ حدث خطأ أثناء الفلترة', error: err.message });
  }
};