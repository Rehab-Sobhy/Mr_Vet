# 📚 E-Learning Platform

تطبيق E-Learning هو منصة تعليم إلكتروني تتيح للمستخدمين إنشاء حسابات خاصة بهم، وتصفح الكورسات والمواد التعليمية، مع توفير خصائص الحماية والتحديث والتواصل.

---

## 🚦 توثيق الـ API (Endpoints)

### Auth
- **POST /auth/register**
  - تسجيل طالب جديد (name, email, password, role, phone, academicYear, collegeId[image])
  - الرد: { token, user }
- **POST /auth/login**
  - تسجيل الدخول
- **POST /auth/logout**
  - تسجيل الخروج (إبطال التوكن)
- **POST /auth/forgot-password**
  - إرسال رابط إعادة تعيين كلمة السر
- **POST /auth/reset-password**
  - إعادة تعيين كلمة السر

### User
- **GET /user/**
  - جلب كل المستخدمين (أدمن فقط)
- **PUT /user/:id**
  - تحديث بيانات مستخدم (أدمن أو المستخدم نفسه)
- **DELETE /user/:id**
  - حذف مستخدم (أدمن فقط)
- **DELETE /user/delete-account**
  - حذف الحساب (المستخدم نفسه)
- **POST /user/upload-carnet**
  - رفع الكارنيه مع فحص الصورة (مطلوب توكن)
- **GET /user/me**
  - جلب بيانات المستخدم الحالي
- **GET /user/instructors**
  - جلب كل أسماء المحاضرين
- **GET /user/instructors-with-courses**
  - جلب المحاضرين مع الكورسات

### Courses
- **GET /courses**
  - جلب كل الكورسات
- **POST /courses/upload**
  - رفع كورس جديد (admin/instructor)
- **POST /courses/:id/sections**
  - إضافة سيكشن جديد لكورس
- **GET /courses/filter/by-year?year=2**
  - فلترة الكورسات حسب السنة الدراسية

### Admin
- **GET /admin/users**
  - جلب كل المستخدمين (أدمن فقط)
- **PUT /admin/users/:id**
  - تحديث بيانات مستخدم (أدمن فقط)
- **DELETE /admin/users/:id**
  - حذف مستخدم (أدمن فقط)
- **POST /admin/create-teacher**
  - إنشاء حساب معلم (مع إمكانية رفع صورة profileImage اختيارية)
- **POST /admin/approve-carnet**
  - اعتماد الكارنيه (userId)
- **POST /admin/reject-carnet**
  - رفض الكارنيه (userId)
- **GET /admin/stats**
  - جلب إحصائيات عامة
- **POST /admin/subscriptions/activate**
  - تفعيل اشتراك طالب في كورس (email أو userId + courseId)
- **GET /admin/subscriptions**
  - جلب كل الاشتراكات مع بيانات الطالب والكورس (أدمن فقط)
- **POST /admin/subscriptions**
  - إضافة اشتراك يدوي (studentId, courseId, startDate, endDate)
- **DELETE /admin/subscriptions/:id**
  - حذف اشتراك طالب من كورس
- **GET /admin/logs**
  - جلب سجل النشاطات الإدارية (log system)
- **PUT /admin/courses/:id**
  - تعديل كورس (أدمن فقط)
- **DELETE /admin/courses/:id**
  - حذف كورس (أدمن فقط)

### Notifications
- **POST /notifications**
  - إرسال إشعار جديد
- **GET /notifications/my**
  - جلب إشعارات المستخدم
- **POST /notifications/mark-as-read**
  - تعليم إشعار كمقروء
- **POST /notifications/mark-all-as-read**
  - تعليم كل الإشعارات كمقروءة

---

## ⚙️ ملاحظات هامة
- رفع صورة المعلم عند إنشاء حساب معلم من الأدمن اختياري (profileImage: file).
- جميع العمليات الحساسة محمية بـ JWT ويجب إرسال التوكن في الهيدر.
- حالة الكارنيه (carnetStatus) تتحكم في صلاحيات الطالب.
- راجع swagger.yaml لمزيد من التفاصيل.

---

## 🛠️ التكنولوجيا المستخدمة

* **Node.js** – بيئة التشغيل الخلفية.
* **Express.js** – إطار عمل لإنشاء الخادم.
* **MongoDB** – قاعدة البيانات.
* **Mongoose** – أداة للتعامل مع MongoDB.
* **JWT** – لحماية الجلسات وتوثيق المستخدم.

---

## 👨‍💻 المطور

* **الاسم:**   Eng-Angelo Rezq
* **المؤسسة:** Techno Media
* **الموقع:** Minya, Egypt
* **مجال العمل:** تطوير تطبيقات ويب وموبايل، تحليل بيانات، تعليم تقني.

---

## 📑 بنية كورس (Course model)

- **courseName**: اسم الكورس (مطلوب)
- **price**: سعر الكورس (افتراضي 0)
- **instructorName**: اسم المحاضر (مطلوب)
- **coverImage**: صورة الغلاف (اختياري)
- **academicYear**: السنة الدراسية (مطلوب)
- **category**: تصنيف الكورس (مطلوب)
  - general: كورسات عامة
  - credit: كورسات برامج/كريديت
- **sections**: قائمة السكاشن (كل سيكشن يحتوي على: sectionType, sectionTitle, videos[])
  - **sectionType**: نوع السيكشن (Theory/Practical)
  - **sectionTitle**: عنوان السيكشن
  - **videos**: [{ title, videoUrl }]

> عند رفع كورس جديد يجب تحديد category (general أو credit)، ويمكنك جلب الكورسات حسب التصنيف عبر `/courses?category=general` أو `/courses?category=credit`.


