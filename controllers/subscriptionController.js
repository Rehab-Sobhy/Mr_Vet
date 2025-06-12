const Subscription = require('../models/Subscription');

// ✅ إضافة اشتراك جديد
exports.subscribe = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.body;
    const userId = req.user._id;

    // تحقق إذا كان مشترك بالفعل
    const exists = await Subscription.findOne({ userId, courseId, status: 'active' });
    if (exists) {
      return res.status(400).json({ message: '❌ أنت مشترك بالفعل في هذا الكورس' });
    }

    const subscription = await Subscription.create({
      userId,
      courseId,
      startDate,
      endDate,
      status: 'active'
    });

    res.status(201).json({ message: '✅ تم الاشتراك في الكورس بنجاح', subscription });
  } catch (error) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء الاشتراك', error: error.message });
  }
};

// ✅ إلغاء الاشتراك (تغيير الحالة إلى cancelled)
exports.unsubscribe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    const subscription = await Subscription.findOneAndUpdate(
      { userId, courseId, status: 'active' },
      { status: 'cancelled', endDate: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: '❌ لا يوجد اشتراك نشط لهذا الكورس' });
    }

    res.status(200).json({ message: '✅ تم إلغاء الاشتراك بنجاح', subscription });
  } catch (error) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء إلغاء الاشتراك', error: error.message });
  }
};

// ✅ جلب اشتراكات مستخدم معين
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const subscriptions = await Subscription.find({ userId }).populate('courseId');
    res.status(200).json({ subscriptions });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء جلب الاشتراكات', error: err.message });
  }
};

// ✅ التحقق من اشتراك المستخدم في كورس معين
exports.checkSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;
    const subscription = await Subscription.findOne({ userId, courseId, status: 'active' });
    res.status(200).json({ enrolled: !!subscription });
  } catch (error) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء التحقق من الاشتراك', error: error.message });
  }
};

// ✅ جلب كل الاشتراكات (للأدمن)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate('userId').populate('courseId');
    res.status(200).json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء جلب كل الاشتراكات', error: error.message });
  }
};
