<div align="center">

# 🤝 متطوع | Mutatawi

**منصة تربط المتطوعين بالفرص التطوعية في مجتمعاتهم**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore%20%2B%20Storage-orange?logo=firebase)](https://firebase.google.com/)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://www.mutatawi.com/)

[🌐 الموقع المباشر](https://www.mutatawi.com/) · [📖 التوثيق](./docs/)

</div>

---

## 📋 نظرة عامة

منصة **متطوع** هي منصة عربية متكاملة تهدف إلى ربط المتطوعين بالمنظمات والفرق التطوعية. تتيح للمتطوعين البحث عن فرص تناسب مهاراتهم واهتماماتهم، وللمنظمات نشر فرصها وإدارة المتطوعين بكفاءة. تقدم المنصة أيضاً نظام كورسات تعليمي ومجموعة أدوات إنتاجية مجانية.

---

## ✨ المميزات الرئيسية

### 🔐 نظام المصادقة
- تسجيل متعدد الخطوات مع **تحقق OTP بالبريد الإلكتروني**
- تسجيل الدخول بـ **Google** أو البريد الإلكتروني وكلمة المرور
- إعادة تعيين كلمة المرور عبر البريد
- تحقق من قوة كلمة المرور
- حماية من محاولات الاختراق (**Rate Limiting**)

### 📊 لوحات التحكم
- **لوحة المتطوع** — متابعة الطلبات، ساعات التطوع، الكورسات
- **لوحة المنظمة** — نشر فرص، إدارة المتطوعين، مراجعة الطلبات

### 🔍 الفرص التطوعية
- تصفح وبحث حسب الفئة، الموقع، ونوع العمل (حضوري/عن بعد)
- نظام تقديم طلبات مع إشعارات بريد إلكتروني
- تقييم التجربة التطوعية بعد الانتهاء

### 📚 نظام الكورسات التعليمية
- كورسات تعليمية بدروس فيديو وأنشطة
- تتبع تقدم المتعلم
- نظام إنجاز الدورات
- رفع صور الكورسات مباشرة إلى **Firebase Storage**

### 🛠️ أدوات مجانية
| الأداة | الوصف |
|--------|-------|
| 📄 Word to PDF | تحويل ملفات Word إلى PDF |
| 📊 Excel to PDF | تحويل ملفات Excel إلى PDF |
| 🖼️ Image to PDF | تحويل الصور إلى PDF |
| 📑 PPT to PDF | تحويل عروض PowerPoint إلى PDF |
| 🔗 Merge PDF | دمج ملفات PDF متعددة |
| 📰 PDF to Image | تحويل PDF إلى صور |
| 📝 PDF to Word | تحويل PDF إلى Word |
| 📋 CV Builder | إنشاء سيرة ذاتية احترافية |
| ⏱️ Hours Calculator | حساب ساعات التطوع |
| 🏅 Certificate | إنشاء شهادات تطوع |

---

## 👑 نظام إدارة المشرفين (3 مستويات)

| المستوى | الرمز | الصلاحيات |
|---------|-------|-----------|
| **مدير عام** (Super Admin) | 👑 | إضافة/حذف مشرفين + تعديل/حذف **جميع** الكورسات + إدارة كاملة |
| **محرر** (Editor) | ✏️ | تعديل/حذف **جميع** الكورسات — بدون إدارة مشرفين |
| **منشئ كورسات** (Creator) | 📚 | إنشاء كورسات + تعديل/حذف **كورساته فقط** |

### كيف يعمل؟
- الإيميل الأساسي `aabuzaid242@gmail.com` هو **المدير العام** الافتراضي
- عند إضافة مشرف جديد، يُرسل له **إيميل ترحيبي** يتضمن:
  - مستواه وصلاحياته
  - خطوات إضافة ونشر كورس
  - رابط مباشر للوحة الإدارة
- الصلاحيات مطبقة على مستوى **Firestore Security Rules** وكذلك **واجهة المستخدم**

---

## 🔒 الأمان

| الطبقة | الحماية |
|--------|---------|
| **Middleware** | فحص Firebase token + حماية المسارات الحساسة (`/admin`, `/volunteer`, `/organization`) |
| **Firestore Rules** | صلاحيات مبنية على المستويات (RBAC) باستخدام `adminEmails` collection |
| **Rate Limiting** | حماية من Brute Force على `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/stats` |
| **HSTS** | Strict-Transport-Security header |
| **OTP** | رمز تحقق بريدي صالح 5 دقائق فقط |
| **Password Strength** | تحقق من قوة كلمة المرور عند التسجيل |
| **Admin SDK** | العمليات الحساسة تتم عبر Firebase Admin SDK (Server-side) |
| **Git History** | تنظيف كامل من الأسرار باستخدام `git-filter-repo` |

---

## 🏗️ هيكل المشروع

```
mutatawi/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 🔐 صفحات المصادقة
│   │   ├── login/                #    ├── تسجيل الدخول
│   │   ├── register/             #    ├── التسجيل
│   │   ├── forgot-password/      #    ├── نسيت كلمة المرور
│   │   ├── reset-password/       #    ├── إعادة تعيين كلمة المرور
│   │   ├── verify-email/         #    ├── تحقق البريد
│   │   └── complete-profile/     #    └── إكمال الملف الشخصي
│   │
│   ├── (dashboard)/              # 📊 لوحات التحكم
│   │   ├── organization/         #    ├── لوحة المنظمة
│   │   └── volunteer/            #    └── لوحة المتطوع
│   │
│   ├── admin/                    # 👑 لوحة الإدارة
│   │   └── courses/              #    └── إدارة الكورسات (إنشاء، تعديل، حذف، تحليلات)
│   │
│   ├── courses/                  # 📚 صفحات الكورسات (عرض، تفاصيل)
│   ├── opportunities/            # 🔍 تصفح الفرص التطوعية
│   ├── tools/                    # 🛠️ أدوات مجانية (10 أدوات)
│   │
│   ├── api/                      # 🔌 API Routes
│   │   ├── admin/emails/         #    ├── إدارة المشرفين (RBAC)
│   │   ├── auth/                 #    ├── المصادقة
│   │   │   ├── send-otp/         #    │   ├── إرسال رمز التحقق
│   │   │   ├── verify-otp/       #    │   ├── التحقق من الرمز
│   │   │   ├── first-login/      #    │   ├── أول تسجيل دخول
│   │   │   ├── reset-password/   #    │   └── إعادة تعيين كلمة المرور
│   │   │   └── reset-password-confirm/
│   │   ├── applications/         #    ├── الطلبات
│   │   ├── notifications/        #    ├── الإشعارات
│   │   ├── opportunities/        #    ├── الفرص
│   │   ├── send-email/           #    ├── إرسال بريد
│   │   └── stats/                #    └── الإحصائيات
│   │
│   ├── components/               # 🧩 المكونات
│   │   ├── auth/                 #    ├── مكونات المصادقة
│   │   ├── dashboard/            #    ├── مكونات لوحة التحكم
│   │   ├── landing/              #    ├── مكونات الصفحة الرئيسية
│   │   ├── layout/               #    ├── التخطيط (Navbar, Footer, Sidebar)
│   │   ├── shared/               #    ├── مكونات مشتركة
│   │   └── ui/                   #    └── عناصر UI أساسية
│   │
│   ├── context/                  # 🌐 React Context (AuthContext)
│   ├── hooks/                    # 🪝 Custom Hooks (useAuth, useFirestore)
│   ├── i18n/                     # 🌍 الترجمة
│   ├── lib/                      # 📚 الخدمات والأدوات
│   │   ├── firebase.ts           #    ├── إعداد Firebase Client
│   │   ├── firebase-admin.ts     #    ├── إعداد Firebase Admin SDK
│   │   ├── auth.ts               #    ├── وظائف المصادقة
│   │   ├── firestore.ts          #    ├── عمليات قاعدة البيانات
│   │   ├── email.ts              #    ├── خدمة البريد (7 أنواع إيميل)
│   │   ├── adminConfig.ts        #    ├── إدارة المشرفين (Client-side)
│   │   ├── storage.ts            #    ├── رفع الملفات (Firebase Storage)
│   │   ├── analytics.ts          #    ├── تتبع الإحصائيات
│   │   ├── validation.ts         #    └── مخططات التحقق (Zod)
│   │   └── utils.ts
│   │
│   └── types/                    # 📝 TypeScript Types
│
├── docs/                         # 📖 التوثيق التفصيلي
├── public/                       # 🖼️ الملفات العامة
├── middleware.ts                  # 🛡️ حماية المسارات + Security Headers
├── firestore.rules               # 🔒 قواعد أمان Firestore (RBAC)
├── storage.rules                 # 🔒 قواعد أمان Firebase Storage
├── firebase.json                 # ⚙️ إعدادات Firebase CLI
├── .firebaserc                   # 🔗 ربط مشروع Firebase
├── tailwind.config.js            # 🎨 إعدادات التصميم
└── next.config.js                # ⚙️ إعدادات Next.js
```

---

## 🚀 التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **Next.js 14** | إطار العمل الأساسي (App Router + SSR) |
| **TypeScript** | أمان الأنواع في كامل المشروع |
| **Firebase Auth** | مصادقة المستخدمين (بريد + Google + OTP) |
| **Cloud Firestore** | قاعدة بيانات NoSQL في الوقت الحقيقي |
| **Firebase Storage** | رفع وتخزين ملفات الصور |
| **Firebase Admin SDK** | عمليات السيرفر الآمنة |
| **Tailwind CSS** | نظام تصميم متجاوب مع RTL |
| **Framer Motion** | أنيميشن سلس واحترافي |
| **Zod** | تحقق من صحة البيانات |
| **Nodemailer** | إرسال بريد إلكتروني عبر SMTP |
| **React Hot Toast** | إشعارات مستخدم فورية |
| **Vercel** | استضافة وتوزيع تلقائي |
| **Vercel Analytics** | تتبع الإحصائيات |

---

## 📧 أنواع البريد الإلكتروني (7 أنواع)

| النوع | الوصف |
|-------|-------|
| 🎉 **ترحيب** | عند تسجيل حساب جديد (متطوع/منظمة) |
| 🔐 **رمز OTP** | تحقق بريد إلكتروني عند التسجيل |
| ✅ **تأكيد تقديم** | عند تقديم طلب تطوع |
| 📩 **إشعار منظمة** | عند استلام طلب تطوع جديد |
| 🏆 **قبول طلب** | عند قبول المتطوع |
| 📝 **رفض طلب** | عند رفض الطلب مع تشجيع |
| ⭐ **تقييم** | طلب تقييم التجربة بعد انتهاء الفرصة |
| 👑 **دعوة مشرف** | عند إضافة مشرف جديد مع صلاحياته وتعليمات الاستخدام |

---

## 🛠️ التشغيل المحلي

```bash
# 1. استنساخ المشروع
git clone https://github.com/aabuzaid1/Mutatawi.git
cd Mutatawi

# 2. تثبيت الاعتماديات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env.local
# عدّل القيم في .env.local (Firebase keys, SMTP, etc.)

# 4. تشغيل السيرفر المحلي
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

### متغيرات البيئة المطلوبة

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=

# SMTP (Gmail)
SMTP_EMAIL=
SMTP_PASSWORD=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🚀 النشر (Deployment)

### Vercel (الطريقة الموصى بها)
1. ارفع المشروع على GitHub
2. اربط الريبو بـ [Vercel](https://vercel.com)
3. أضف متغيرات البيئة في Settings → Environment Variables
4. Deploy تلقائياً مع كل push

### Firebase Rules
```bash
# تسجيل الدخول
firebase login

# رفع قواعد Firestore
firebase deploy --only firestore:rules

# رفع قواعد Storage
firebase deploy --only storage
```

---

## 📖 التوثيق

| الملف | الوصف |
|-------|-------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | هيكلية المشروع التفصيلية |
| [SYSTEMS_FLOW.md](./docs/SYSTEMS_FLOW.md) | تدفق الأنظمة والعمليات |
| [PROJECT_DOCUMENTATION-ar.md](./docs/PROJECT_DOCUMENTATION-ar.md) | توثيق المشروع بالعربية |
| [DEVELOPMENT_JOURNEY.md](./docs/DEVELOPMENT_JOURNEY.md) | رحلة التطوير |

---

## 📝 الرخصة

هذا المشروع مرخص بموجب رخصة ISC.

---

<div align="center">

**صُنع بـ ❤️ لخدمة المجتمع التطوعي العربي**

[🌐 mutatawi.com](https://www.mutatawi.com/)

</div>
