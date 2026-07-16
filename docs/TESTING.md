# دليل الاختبار والتشغيل (Testing and Setup Guide)

يحتوي هذا الملف على خطوات تهيئة قاعدة البيانات المحلية، إعداد تطبيق Meta، واستخدام ngrok لاختبار الـ Webhook محلياً.

---

## 1. تهيئة قاعدة البيانات المحلية

1. تأكد من أن خادم **PostgreSQL** يعمل محلياً على جهازك على المنفذ الافتراضي `5432`.
2. قم بإنشاء قاعدة بيانات جديدة باسم `instagram_bot` باستخدام أداة مثل pgAdmin أو عبر terminal:
   ```sql
   CREATE DATABASE instagram_bot;
   ```

## 2. ملء متغيرات البيئة `.env`

قم بإنشاء ملف `.env` في المجلد الرئيسي للمشروع بناءً على `.env.example`:
- استبدل `YOUR_PASSWORD` بكلمة المرور الحقيقية لمستخدم `postgres` الخاص بك.
- اضبط `AUTH_SECRET` كـ String طويل وعشوائي لحماية جلسة المدراء والموظفين.
- اضبط `ADMIN_EMAIL` و `ADMIN_PASSWORD` اللذين ستستخدمهما للدخول إلى لوحة التحكم لأول مرة.

مثال:
```env
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/instagram_bot?schema=public"

INSTAGRAM_ACCESS_TOKEN="سيرسل_لك_من_قبل_مطور_تطبيق_ميتا"
INSTAGRAM_ACCOUNT_ID="معرف_حساب_إنستغرام_للأعمال"
INSTAGRAM_VERIFY_TOKEN="اختر_رمز_تحقق_سري"

META_API_VERSION="v20.0"
META_APP_SECRET="" # اختياري للتحقق من توقيع الطلبات

AUTH_SECRET="long-random-string-used-to-secure-tokens"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"

NEXT_PUBLIC_APP_NAME="Instagram Bot"
```

## 3. تشغيل Migrations وقاعدة البيانات

بعد إعداد ملف `.env` بشكل صحيح، نفّذ الأوامر التالية بالترتيب:

1. لتشغيل الـ Migrations وإنشاء الجداول في PostgreSQL:
   ```bash
   npx prisma migrate dev --name init
   ```
2. لتوليد Client الـ Prisma من جديد (إذا لزم الأمر):
   ```bash
   npx prisma generate
   ```
3. لتشغيل الـ Seed وحفظ المستخدم المدير والإعدادات الافتراضية:
   ```bash
   npx prisma db seed
   ```

## 4. تشغيل المشروع محلياً

شغّل خادم التطوير لـ Next.js:
```bash
npm run dev
```
سيكون المشروع متاحاً على الرابط المحلي: [http://localhost:3000](http://localhost:3000).
- انتقل إلى [http://localhost:3000/login](http://localhost:3000/login) لتسجيل الدخول باستخدام `ADMIN_EMAIL` و `ADMIN_PASSWORD` اللذين أعددتهما.

---

## 5. اختبار Webhook إنستغرام محلياً

تتطلب Meta رابط HTTPS عام للاتصال بالـ Webhook الخاص بك. سنستخدم **ngrok** لتوفير هذا الرابط.

### أ. تشغيل ngrok
قم بتنزيل ngrok وتفعيل حسابك، ثم شغّل الأمر التالي لتوجيه المنفذ `3000`:
```bash
ngrok http 3000
```
سيعطيك ngrok رابطاً عاماً مثل: `https://abcd-12-34.ngrok-free.app`.

### ب. ضبط الإعدادات في Meta App Dashboard
1. انتقل إلى لوحة تحكم تطبيق Meta الخاص بك في [Meta for Developers](https://developers.facebook.com/).
2. أضف منتج **Instagram Graph API** أو **Webhooks**.
3. في حقل **Callback URL**، أضف رابط ngrok متبوعاً بمسار الـ Webhook الخاص بنا:
   ```
   https://abcd-12-34.ngrok-free.app/api/webhooks/instagram
   ```
4. في حقل **Verify Token**، أدخل القيمة التي حددتها لـ `INSTAGRAM_VERIFY_TOKEN` في ملف `.env` (مثال: `change-this-verify-token`).
5. اضغط على **Verify and Save**. ستقوم Meta بعمل طلب `GET` للتحقق من الاتصال وسيستجيب الكود الخاص بنا بنجاح.

### ج. الاشتراك في أحداث الرسائل
1. في إعدادات Webhooks الخاصة بالـ Instagram، ابحث عن حقل **Subscription fields**.
2. اشترك في الأحداث التالية:
   - `messages` (استقبال الرسائل الواردة)
   - `messaging_postbacks` (استقبال أزرار البدء والردود السريعة)

---

## 6. اختبار دورة العمل والردود التلقائية

1. اطلب من حساب إنستغرام آخر (حساب شخصي للتجربة) إرسال رسالة نصية إلى حساب الأعمال المرتبط بالتطبيق.
2. **التحقق من تخزين البيانات**:
   - تحقق من ظهور المحادثة الجديدة فوراً في لوحة التحكم [http://localhost:3000/dashboard/conversations](http://localhost:3000/dashboard/conversations).
   - تحقق من زيادة عدد الرسائل في لوحة التحكم وحفظ الحدث الخام في جدول `WebhookEvent` كمرجع.
3. **اختبار الرد التلقائي**:
   - أرسل كلمة «السلام عليكم» -> سيجيب البوت تلقائياً بالتحية الافتراضية.
   - أرسل كلمة «بكم» أو «السعر» -> سيجيب البوت بالرد الخاص بالأسعار.
4. **اختبار التحويل لموظف (Handoff)**:
   - أرسل كلمة «اريد التحدث مع موظف» أو « المسؤول» -> سيقوم النظام بتعطيل البوت للمحادثة فوراً، وتغيير حالتها إلى `WAITING_AGENT` (انتظار الموظف)، وإرسال رسالة التحويل التلقائية للعميل لمرة واحدة.
   - إذا تم إرسال رسائل جديدة بعد ذلك من العميل، فلن يجيب البوت تلقائياً بل سيحفظها فقط بانتظار الموظف.
5. **استلام المحادثة وإعادة البوت**:
   - ادخل إلى تفاصيل المحادثة من لوحة التحكم، واضغط على **استلام المحادثة** للبدء بالمتابعة اليدوية (تصبح الحالة `HUMAN_ACTIVE`).
   - اكتب رداً يدوياً في صندوق الدردشة واضغط إرسال -> سيتم إرسال الرسالة للعميل وتخزينها تحت نوع `AGENT`.
   - عند الانتهاء من خدمة العميل، اضغط على **إعادة تشغيل البوت** لتفعيل الرد التلقائي عليها من جديد (تصبح الحالة `BOT_ACTIVE`).
   - اضغط على **إغلاق المحادثة** عند إغلاق التذكرة نهائياً (تصبح الحالة `CLOSED`).
