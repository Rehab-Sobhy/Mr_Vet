const Notification = require('../models/Notification');

// ✅ إنشاء إشعار جديد
exports.createNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    if (!userId || !message || !type) {
      return res.status(400).json({ message: '❌ كل الحقول مطلوبة: userId, message, type' });
    }

    const notification = new Notification({
      userId,
      message,
      type,
      read: false,
      createdAt: new Date()
    });

    await notification.save();
    res.status(201).json({ message: '✅ تم إنشاء الإشعار بنجاح!', notification });
  } catch (err) {
    res.status(500).json({ message: '❌ فشل في إنشاء الإشعار', error: err.message });
  }
};

// ✅ جلب الإشعارات الخاصة بمستخدم معين
const getUserNotifications = async (req, res) => {
  try {
    // جلب الإشعارات للمستخدم الحالي فقط
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ message: '✅ تم جلب الإشعارات بنجاح!', notifications });
  } catch (error) {
    console.error("❌ Error fetching user notifications:", error);
    res.status(500).json({ message: '❌ فشل في جلب الإشعارات', error: error.message });
  }
};

// ✅ تعليم إشعار كمقروء
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: '❌ الإشعار غير موجود' });
    res.status(200).json({ message: '✅ تم تعليم الإشعار كمقروء', notification });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء التعليم', error: err.message });
  }
};

// ✅ تعليم كل الإشعارات كمقروءة
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: '✅ تم تعليم كل الإشعارات كمقروءة' });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء التعليم', error: err.message });
  }
};

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead };
