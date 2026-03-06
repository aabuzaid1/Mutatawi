<div align="center">

# 🤝 متطوع | Mutatawi

**منصة تربط المتطوعين بالفرص التطوعية في مجتمعاتهم**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-orange?logo=firebase)](https://firebase.google.com/)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://mutatawi.vercel.app/)

[🌐 الموقع المباشر](https://mutatawi.vercel.app/) · [📖 التوثيق](./docs/)

</div>

---

## 📋 نظرة عامة

منصة **متطوع** هي منصة عربية متكاملة تهدف إلى ربط المتطوعين بالمنظمات والفرق التطوعية. تتيح للمتطوعين البحث عن فرص تناسب مهاراتهم، وللمنظمات نشر فرصها وإدارة المتطوعين بكفاءة.

---

## 🏗️ هيكل المشروع

```
mutatawi/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 🔐 صفحات المصادقة (تسجيل، دخول، ...)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify-email/
│   │   └── complete-profile/
│   │
│   ├── (dashboard)/              # 📊 لوحات التحكم
│   │   ├── organization/         #    ├── لوحة المنظمة
│   │   └── volunteer/            #    └── لوحة المتطوع
│   │
│   ├── opportunities/            # 🔍 تصفح الفرص التطوعية
│   │
│   ├── api/                      # 🔌 API Routes
│   │   ├── auth/                 #    ├── المصادقة (reset-password, first-login)
│   │   ├── applications/         #    ├── الطلبات (apply, withdraw)
│   │   └── send-email/           #    └── إرسال البريد الإلكتروني
│   │
│   ├── components/               # 🧩 المكونات
│   │   ├── auth/                 #    ├── مكونات المصادقة
│   │   ├── dashboard/            #    ├── مكونات لوحة التحكم
│   │   ├── landing/              #    ├── مكونات الصفحة الرئيسية
│   │   ├── layout/               #    ├── التخطيط (Navbar, Footer, Sidebar)
│   │   ├── shared/               #    ├── مكونات مشتركة (FloatingButtons, AuthGuard, ...)
│   │   └── ui/                   #    └── عناصر UI أساسية (Button, Input, Card, Modal, ...)
│   │
│   ├── context/                  # 🌐 React Context (AuthContext)
│   ├── hooks/                    # 🪝 Custom Hooks (useAuth, useFirestore, useRealtime)
│   ├── lib/                      # 📚 الخدمات والأدوات
│   │   ├── firebase.ts           #    ├── إعداد Firebase Client
│   │   ├── firebase-admin.ts     #    ├── إعداد Firebase Admin SDK
│   │   ├── auth.ts               #    ├── وظائف المصادقة
│   │   ├── firestore.ts          #    ├── عمليات قاعدة البيانات
│   │   ├── email.ts              #    ├── خدمة البريد الإلكتروني
│   │   ├── analytics.ts          #    ├── تتبع الإحصائيات
│   │   ├── validation.ts         #    ├── مخططات التحقق (Zod)
│   │   └── utils.ts              #    └── أدوات مساعدة
│   │
│   └── types/                    # 📝 TypeScript Types
│
├── docs/                         # 📖 التوثيق التفصيلي
├── public/                       # 🖼️ الملفات العامة (شعارات، أيقونات)
├── middleware.ts                  # 🛡️ حماية المسارات + Security Headers
├── firestore.rules               # 🔒 قواعد أمان Firestore
├── tailwind.config.js            # 🎨 إعدادات التصميم
└── next.config.js                # ⚙️ إعدادات Next.js
```

---

## 🚀 التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| **Next.js 14** | إطار العمل الأساسي (App Router + SSR) |
| **TypeScript** | أمان الأنواع في كامل المشروع |
| **Firebase Auth** | مصادقة المستخدمين (بريد + Google) |
| **Cloud Firestore** | قاعدة بيانات NoSQL في الوقت الحقيقي |
| **Tailwind CSS** | نظام تصميم متجاوب مع RTL |
| **Framer Motion** | أنيميشن سلس واحترافي |
| **Zod** | تحقق من صحة البيانات |
| **Nodemailer** | إرسال بريد إلكتروني عبر SMTP |
| **Vercel** | استضافة وتوزيع تلقائي |

---

## ✨ المميزات الرئيسية

- 🔐 **نظام مصادقة متكامل** — تسجيل متعدد الخطوات، تسجيل Google، تحقق بريد إلكتروني
- 📊 **لوحات تحكم مخصصة** — لوحة للمتطوعين وأخرى للمنظمات
- 🔍 **تصفح وتقديم الفرص** — بحث، تصفية، وتقديم طلبات
- 📧 **إشعارات بريد إلكتروني** — ترحيب، تأكيد تقديم، وإعادة تعيين كلمة المرور
- 📈 **تحليلات وإحصائيات** — تتبع الزيارات والأحداث
- 🛡️ **حماية أمنية** — Security Headers، Firestore Rules، Rate Limiting
- 🌍 **دعم RTL** — واجهة عربية بالكامل
- ⚡ **أداء محسّن** — تحميل كسول، توليد ثابت، تحسين صور

---

## 🛠️ التشغيل المحلي

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-repo/mutatawi.git
cd mutatawi

# 2. تثبيت الاعتماديات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env.local
# عدّل القيم في .env.local

# 4. تشغيل السيرفر المحلي
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

---

## 📖 التوثيق

| الملف | الوصف |
|-------|-------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | هيكلية المشروع التفصيلية |
| [SYSTEMS_FLOW.md](./docs/SYSTEMS_FLOW.md) | تدفق الأنظمة والعمليات |
| [PROJECT_DOCUMENTATION-ar.md](./docs/PROJECT_DOCUMENTATION-ar.md) | توثيق المشروع بالعربية |
| [DEVELOPMENT_JOURNEY.md](./docs/DEVELOPMENT_JOURNEY.md) | رحلة التطوير |

---

<div align="center">


</div>
