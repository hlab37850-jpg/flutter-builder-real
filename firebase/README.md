# نشر الخادم الخلفي (Firebase) — Mahani Builder AI

هذا المجلد يوفّر: **مصادقة حقيقية للمستخدمين (Auth)**، **قاعدة بيانات لحفظ سجل المشاريع (Firestore)**، و**دالة سحابية تُخفي مفتاح الذكاء الاصطناعي عن المتصفح تمامًا**.

لا يمكن لأي أداة تعمل من داخل محادثة أو ملفات ثابتة أن "تنشر" هذا نيابة عنك على خادم حي — الخطوات التالية حقيقية وتنفّذها أنت بنفسك، تستغرق نحو ١٥ دقيقة.

## المتطلبات
- حساب Google (مجاني)
- Node.js مثبّت على حاسوبك (لتشغيل أوامر `firebase`)

## الخطوات

### ١) أنشئ مشروع Firebase
1. اذهب إلى https://console.firebase.google.com
2. "Add project" → اختر اسمًا → أكمل الإنشاء
3. من إعدادات المشروع (⚙️ → Project settings) فعّل:
   - **Authentication** → Sign-in method → فعّل "Email/Password"
   - **Firestore Database** → Create database → ابدأ بوضع "Production mode"
4. من نفس الإعدادات، أضف تطبيق ويب (</> Add app) وانسخ كائن `firebaseConfig` الناتج — ستحتاجه في الخطوة ٤.

### ٢) ثبّت أدوات Firebase محليًا
```bash
npm install -g firebase-tools
firebase login
```

### ٣) اربط هذا المجلد بمشروعك
افتح `.firebaserc` وبدّل `YOUR_FIREBASE_PROJECT_ID` بمعرّف مشروعك الفعلي (يظهر في إعدادات Firebase).

### ٤) فعّل مفتاح الذكاء الاصطناعي بأمان (بدون كشفه في المتصفح)
```bash
cd firebase
firebase functions:secrets:set ANTHROPIC_API_KEY
```
سيطلب منك لصق مفتاح Anthropic API الخاص بك — يُخزَّن مشفّرًا في Google Secret Manager، ولا يظهر أبدًا في كود العميل.

### ٥) انشر كل شيء
```bash
cd firebase
firebase deploy
```
هذا ينشر: الاستضافة (ملفات الموقع كلها من المجلد الأب)، قواعد Firestore، والدالة السحابية `generateProject`.

بعد النشر، ستحصل على:
- رابط موقعك المباشر (مثل `https://your-project.web.app`)
- رابط الدالة السحابية (مثل `https://us-central1-your-project.cloudfunctions.net/generateProject`)

### ٦) اربط الواجهة الأمامية بالمشروع
افتح `firebase-integration.js` في المجلد الرئيسي للموقع، وعدّل أعلى الملف:
```js
const firebaseConfig = { /* الصق كائن الإعداد من الخطوة ١ هنا */ };
const CLOUD_FUNCTION_URL = "https://us-central1-YOUR_PROJECT.cloudfunctions.net/generateProject";
```
انشر التحديث مرة أخرى (`firebase deploy --only hosting`) وستظهر تلقائيًا في مساحة العمل:
- زر تسجيل الدخول / إنشاء حساب
- لوحة "سجل مشاريعي" لحفظ المشاريع واستعادتها من أي جهاز
- خيار "توليد آمن عبر السحابة" في قسم الذكاء الاصطناعي — يستخدم الدالة السحابية بدل مفتاحك الشخصي الظاهر في المتصفح

## التكلفة
Firebase له خطة مجانية سخية (Spark) تكفي للاستخدام الشخصي وبداية المشروع. الدالة السحابية تحتاج خطة **Blaze** (ادفع أثناء الاستخدام) لأنها تستدعي API خارجيًا — لكن التكلفة تبقى شبه معدومة لعدد استخدامات معتدل، وتدفع فقط تكلفة استدعاءات Anthropic الفعلية + هامش بسيط جدًا من Firebase.
