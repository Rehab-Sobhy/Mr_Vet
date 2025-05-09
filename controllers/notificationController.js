const Notification = require('../models/Notification');

// ✅ إنشاء إشعار جديد
const createNotification = async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    // التحقق من البيانات
    if (!userId || !title || !message) {
      return res.status(400).json({ message: '❌ كل الحقول مطلوبة: userId, title, message' });
    }

    // إنشاء الإشعار
    const notification = new Notification({
      userId,
      title,
      message,
      read: false, // الإشعار غير مقروء عند الإنشاء
    });

    await notification.save();
    res.status(201).json({ message: '✅ تم إنشاء الإشعار بنجاح!', notification });
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    res.status(500).json({ message: '❌ فشل في إنشاء الإشعار', error: error.message });
  }
};

// ✅ جلب الإشعارات الخاصة بمستخدم معين
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    // التحقق من وجود معرف المستخدم
    if (!userId) {
      return res.status(400).json({ message: '❌ معرف المستخدم مطلوب!' });
    }

    // جلب الإشعارات من قاعدة البيانات
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ message: '✅ تم جلب الإشعارات بنجاح!', notifications });
  } catch (error) {
    console.error("❌ Error fetching user notifications:", error);
    res.status(500).json({ message: '❌ فشل في جلب الإشعارات', error: error.message });
  }
};

// ✅ تحديث حالة الإشعار (تمت قراءته)
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // تحديث حالة الإشعار
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: '❌ الإشعار غير موجود' });
    }

    res.status(200).json({ message: '✅ تم تحديث حالة الإشعار بنجاح', notification });
  } catch (error) {
    console.error("❌ Error updating notification:", error);
    res.status(500).json({ message: '❌ فشل في تحديث الإشعار', error: error.message });
  }
};

module.exports = { createNotification, getUserNotifications, markNotificationAsRead };
