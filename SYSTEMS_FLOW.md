# 🔄 مخططات أنظمة منصة متطوع (Mutatawi Systems Flow)

> هذا المستند يوضح تدفق البيانات والعمليات لجميع الأنظمة في المنصة.

---

## 📋 فهرس الأنظمة

| # | النظام | الوصف |
|---|--------|-------|
| 1 | [المصادقة](#1--نظام-المصادقة-authentication) | تسجيل، دخول، Google OAuth، استعادة كلمة المرور |
| 2 | [الفرص التطوعية](#2--نظام-الفرص-التطوعية-opportunities) | إنشاء، عرض، تعديل، حذف، انتهاء تلقائي |
| 3 | [طلبات التقديم](#3--نظام-طلبات-التقديم-applications) | تقديم، سحب، قبول، رفض |
| 4 | [الإيميلات](#4--نظام-الإيميلات-email-notifications) | 6 أنواع إيميلات عبر Gmail SMTP |
| 5 | [لوحات التحكم](#5--لوحات-التحكم-dashboards) | لوحة المنظمة + لوحة المتطوع |
| 6 | [طبقة البيانات](#6--طبقة-البيانات-data-layer) | Firebase Firestore + Hooks |
| 7 | [البنية التحتية](#7--البنية-التحتية-infrastructure) | Firebase Client/Admin SDK + Vercel |

---

## 1. 🔐 نظام المصادقة (Authentication)

### التدفق العام

```mermaid
flowchart TD
    A[الزائر] --> B{هل لديه حساب؟}
    B -->|نعم| C["/login — تسجيل الدخول"]
    B -->|لا| D["/register — إنشاء حساب"]
    
    C --> C1{طريقة الدخول}
    C1 -->|Email/Password| C2["signIn()"]
    C1 -->|Google| C3["signInWithGoogle()"]
    
    D --> D1["signUp(email, password, name, role)"]
    D1 --> D2["createUserWithEmailAndPassword()"]
    D2 --> D3["إنشاء Profile في Firestore"]
    D3 --> D4["sendEmailVerification()"]
    D4 --> D5["triggerFirstLoginEmail()"]
    D5 --> E["/verify-email"]
    
    C2 --> F{نجاح؟}
    C3 --> F
    F -->|نعم| G["AuthContext يحمّل Profile"]
    G --> H{نوع الحساب}
    H -->|متطوع| I["/volunteer"]
    H -->|منظمة| J["/organization"]
    F -->|لا| K["رسالة خطأ"]
```

### تدفق نسيت كلمة المرور

```mermaid
sequenceDiagram
    participant U as المستخدم
    participant FP as /forgot-password
    participant API as /api/auth/reset-password
    participant Admin as Firebase Admin SDK
    participant SMTP as Gmail SMTP
    participant RP as /reset-password
    participant FB as Firebase Auth

    U->>FP: يدخل الإيميل
    FP->>API: POST {email}
    API->>Admin: generatePasswordResetLink(email)
    Admin-->>API: Firebase Link مع oobCode
    API->>API: استخراج oobCode + بناء رابط مباشر
    API->>SMTP: إرسال إيميل عربي مع الرابط
    SMTP-->>U: 📧 إيميل إعادة التعيين
    U->>RP: يضغط الرابط /?oobCode=ABC
    RP->>FB: verifyPasswordResetCode(oobCode)
    FB-->>RP: البريد الإلكتروني للمستخدم
    RP->>U: نموذج كلمة مرور جديدة + Strength Meter
    U->>RP: يدخل كلمة المرور الجديدة
    RP->>FB: confirmPasswordReset(oobCode, newPassword)
    FB-->>RP: ✅ تم التغيير
    RP->>U: توجيه إلى /login
```

### ملفات النظام

| الملف | الوظيفة |
|-------|---------|
| `app/lib/firebase.ts` | تهيئة Firebase Client SDK |
| `app/lib/auth.ts` | دوال signUp, signIn, signOut, resetPassword, etc. |
| `app/context/AuthContext.tsx` | AuthProvider + onAuthStateChanged listener |
| `app/(auth)/login/page.tsx` | صفحة تسجيل الدخول |
| `app/(auth)/register/page.tsx` | صفحة إنشاء حساب |
| `app/(auth)/forgot-password/page.tsx` | صفحة نسيت كلمة المرور |
| `app/(auth)/reset-password/page.tsx` | صفحة تعيين كلمة مرور جديدة |
| `app/(auth)/verify-email/page.tsx` | صفحة تأكيد البريد |
| `app/(auth)/complete-profile/page.tsx` | إكمال الملف الشخصي |
| `app/api/auth/reset-password/route.ts` | API لإرسال إيميل إعادة التعيين عبر SMTP |
| `app/api/auth/first-login/route.ts` | API لإرسال إيميل ترحيبي |

---

## 2. 📢 نظام الفرص التطوعية (Opportunities)

### دورة حياة الفرصة

```mermaid
stateDiagram-v2
    [*] --> مسودة: المنظمة تنشئ فرصة
    مسودة --> مفتوحة: نشر الفرصة
    مفتوحة --> مغلقة: اكتمال المقاعد أو إغلاق يدوي
    مفتوحة --> منتهية: تاريخ النهاية مرّ
    مفتوحة --> مكتملة: المنظمة تؤكد الاكتمال
    مغلقة --> مفتوحة: إعادة فتح
    منتهية --> [*]: تختفي من القائمة العامة
    مكتملة --> [*]

    note right of منتهية
        تبقى مرئية في:
        - لوحة المنظمة
        - سجل المتطوعين
    end note
```

### تدفق إنشاء فرصة

```mermaid
flowchart TD
    A["المنظمة → /organization/post-opportunity"] --> B["ملء النموذج"]
    B --> C{"رفع صورة؟"}
    C -->|نعم| D["uploadBytes() → Firebase Storage"]
    D --> E["getDownloadURL()"]
    C -->|لا| F["بدون صورة"]
    E --> G["createOpportunity()"]
    F --> G
    G --> H["addDoc() → Firestore/opportunities"]
    H --> I["✅ الفرصة متاحة في /opportunities"]
```

### عرض وفلترة الفرص

```mermaid
flowchart LR
    A["/opportunities"] --> B["getOpportunities(filters)"]
    B --> C{فلاتر}
    C --> D["category: تعليم/صحة/بيئة/..."]
    C --> E["location: المحافظة"]
    C --> F["status: open"]
    C --> G["excludePast: true"]
    B --> H["عرض البطاقات مع Framer Motion"]
    H --> I["الضغط على بطاقة → /opportunities/[id]"]
    I --> J["getOpportunity(id)"]
    J --> K["صفحة التفاصيل + زر تقديم"]
```

### ملفات النظام

| الملف | الوظيفة |
|-------|---------|
| `app/lib/firestore.ts` | createOpportunity, getOpportunities, updateOpportunity, deleteOpportunity |
| `app/opportunities/page.tsx` | صفحة عرض جميع الفرص مع فلاتر |
| `app/opportunities/[id]/page.tsx` | صفحة تفاصيل فرصة واحدة |
| `app/(dashboard)/organization/post-opportunity/page.tsx` | نشر فرصة جديدة |
| `app/(dashboard)/organization/edit-opportunity/page.tsx` | تعديل فرصة |

---

## 3. 📝 نظام طلبات التقديم (Applications)

### تدفق التقديم

```mermaid
sequenceDiagram
    participant V as المتطوع
    participant UI as صفحة الفرصة
    participant API as /api/applications/apply
    participant Admin as Firebase Admin
    participant DB as Firestore
    participant Email as SMTP

    V->>UI: يضغط "تقديم"
    UI->>API: POST {opportunityId} + Bearer Token
    API->>Admin: verifyIdToken(token)
    Admin-->>API: UID المتطوع
    
    API->>DB: هل تقدم مسبقاً؟ (Composite ID)
    DB-->>API: لا
    
    API->>DB: جلب بيانات الفرصة
    API->>DB: جلب بيانات المتطوع
    API->>DB: جلب بيانات المنظمة
    
    API->>DB: إنشاء Application Doc
    API->>DB: spotsFilled += 1
    
    par إيميلات متوازية
        API->>Email: إيميل تأكيد للمتطوع ✅
        API->>Email: إيميل إشعار للمنظمة 📩
    end
    
    API-->>UI: {success: true}
    UI-->>V: 🎉 تم التقديم بنجاح
```

### حالات الطلب

```mermaid
stateDiagram-v2
    [*] --> pending: المتطوع يتقدم
    pending --> accepted: المنظمة تقبل
    pending --> rejected: المنظمة ترفض
    pending --> deleted: المتطوع يسحب الطلب
    accepted --> [*]: 📧 إيميل "مبروك! تم قبولك"
    rejected --> [*]: 📧 إيميل "تحديث على طلبك"
    deleted --> [*]: spotsFilled -= 1
```

### ملفات النظام

| الملف | الوظيفة |
|-------|---------|
| `app/api/applications/apply/route.ts` | API تقديم طلب (مع حماية Token) |
| `app/api/applications/withdraw/route.ts` | API سحب طلب |
| `app/lib/firestore.ts` | createApplication, updateApplicationStatus, withdrawApplication |
| `app/(dashboard)/organization/applicants/page.tsx` | عرض وإدارة المتقدمين |

---

## 4. 📧 نظام الإيميلات (Email Notifications)

### أنواع الإيميلات

```mermaid
flowchart TD
    subgraph "إيميلات تلقائية"
        A["🎉 ترحيب بمستخدم جديد"] --> SMTP
        B["✅ تأكيد تقديم للمتطوع"] --> SMTP
        C["📩 إشعار طلب جديد للمنظمة"] --> SMTP
        D["🏆 قبول طلب"] --> SMTP
        E["📝 رفض طلب"] --> SMTP
        F["🔑 إعادة تعيين كلمة المرور"] --> SMTP
    end

    SMTP["Gmail SMTP via Nodemailer"]
    SMTP --> G["📬 صندوق بريد المستخدم"]

    style SMTP fill:#4285F4,color:#fff
```

### قالب الإيميل

```mermaid
flowchart TD
    A["emailLayout()"] --> B["Logo + Header"]
    B --> C["Header Banner (Icon + Title + Color)"]
    C --> D["Body Content (Dynamic HTML)"]
    D --> E["CTA Button (ctaButton())"]
    E --> F["Footer (Copyright + Site Link)"]
    
    style A fill:#6366f1,color:#fff
```

### ملفات النظام

| الملف | الوظيفة |
|-------|---------|
| `app/lib/email.ts` | Template engine + 5 email functions |
| `app/api/auth/reset-password/route.ts` | إيميل إعادة تعيين كلمة المرور |
| `app/api/auth/first-login/route.ts` | إيميل ترحيبي |
| `.env.local` | SMTP_EMAIL + SMTP_PASSWORD |

---

## 5. 📊 لوحات التحكم (Dashboards)

### لوحة المنظمة

```mermaid
flowchart TD
    A["/organization"] --> B["إحصائيات المنظمة"]
    A --> C["قائمة الفرص المنشورة"]
    
    C --> D["نشر فرصة جديدة"]
    C --> E["تعديل فرصة"]
    C --> F["حذف فرصة"]
    C --> G["عرض المتقدمين"]
    
    G --> H["قبول متطوع"]
    G --> I["رفض متطوع"]
    
    H --> J["📧 إيميل قبول"]
    I --> K["📧 إيميل رفض"]
    
    B --> L["عدد الفرص المنشورة"]
    B --> M["عدد الطلبات المعلقة"]
    B --> N["عدد المتطوعين المقبولين"]
```

### لوحة المتطوع

```mermaid
flowchart TD
    A["/volunteer"] --> B["إحصائيات المتطوع"]
    A --> C["قائمة طلباتي"]
    A --> D["الملف الشخصي"]
    
    C --> E["طلبات معلقة 🟡"]
    C --> F["طلبات مقبولة 🟢"]
    C --> G["طلبات مرفوضة 🔴"]
    C --> H["سحب طلب ❌"]
    
    D --> I["/volunteer/profile"]
    I --> J["تعديل الاسم والبيانات"]
    I --> K["تغيير كلمة المرور"]
    
    B --> L["عدد التقديمات"]
    B --> M["ساعات التطوع"]
    B --> N["الفرص المكتملة"]
```

### ملفات النظام

| الملف | الوظيفة |
|-------|---------|
| `app/(dashboard)/layout.tsx` | Layout مشترك للوحات التحكم |
| `app/(dashboard)/organization/page.tsx` | لوحة المنظمة الرئيسية |
| `app/(dashboard)/organization/applicants/page.tsx` | إدارة المتقدمين |
| `app/(dashboard)/organization/post-opportunity/page.tsx` | نشر فرصة |
| `app/(dashboard)/organization/edit-opportunity/page.tsx` | تعديل فرصة |
| `app/(dashboard)/volunteer/page.tsx` | لوحة المتطوع الرئيسية |
| `app/(dashboard)/volunteer/profile/page.tsx` | الملف الشخصي |

---

## 6. 💾 طبقة البيانات (Data Layer)

### نموذج البيانات (Data Model)

```mermaid
erDiagram
    users ||--o{ opportunities : "ينشر (منظمة)"
    users ||--o{ applications : "يتقدم (متطوع)"
    opportunities ||--o{ applications : "لها طلبات"
    opportunities ||--o{ feedbacks : "لها تقييمات"
    users ||--o{ feedbacks : "يكتب (متطوع)"

    users {
        string uid PK
        string email
        string displayName
        string role "volunteer | organization"
        string phone
        string bio
        string location
        date createdAt
    }

    opportunities {
        string id PK
        string title
        string organizationId FK
        string category
        string location
        string status "open | closed | completed"
        number spotsTotal
        number spotsFilled
        date date
        date createdAt
    }

    applications {
        string id PK "opportunityId_volunteerId"
        string opportunityId FK
        string volunteerId FK
        string status "pending | accepted | rejected | deleted"
        date appliedAt
    }

    feedbacks {
        string id PK
        string opportunityId FK
        string volunteerId FK
        number rating
        string comment
        date createdAt
    }
```

### Hooks وأنماط الوصول

```mermaid
flowchart LR
    subgraph "Client-Side Hooks"
        A["useAuth()"] --> B["AuthContext"]
        C["useFirestore()"] --> D["Firestore fetch/add/update/delete"]
        E["useRealtime()"] --> F["onSnapshot listener"]
    end

    subgraph "Server-Side Functions"
        G["firestore.ts"] --> H["Direct Firestore CRUD"]
        I["firebase-admin.ts"] --> J["Admin SDK (verify tokens, etc.)"]
    end

    B --> K[(Firebase Auth)]
    D --> L[(Firestore)]
    F --> L
    H --> L
    J --> K
```

---

## 7. 🏗️ البنية التحتية (Infrastructure)

### بنية النشر

```mermaid
flowchart TD
    subgraph "Client (Browser)"
        A["Next.js App Router"]
        B["Firebase Client SDK"]
        C["Framer Motion Animations"]
    end

    subgraph "Server (Vercel Serverless)"
        D["API Routes (Node.js)"]
        E["Firebase Admin SDK"]
        F["Nodemailer SMTP"]
    end

    subgraph "Firebase Cloud"
        G[(Authentication)]
        H[(Firestore DB)]
        I[(Storage)]
    end

    subgraph "External"
        J["Gmail SMTP"]
    end

    A --> B
    A --> D
    B --> G
    B --> H
    B --> I
    D --> E
    E --> G
    E --> H
    D --> F
    F --> J
```

### شجرة الملفات

```
app/
├── (auth)/                   # 🔐 صفحات المصادقة
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── verify-email/
│   └── complete-profile/
├── (dashboard)/              # 📊 لوحات التحكم
│   ├── organization/
│   │   ├── page.tsx          # الرئيسية
│   │   ├── applicants/       # إدارة المتقدمين
│   │   ├── post-opportunity/ # نشر فرصة
│   │   └── edit-opportunity/ # تعديل فرصة
│   └── volunteer/
│       ├── page.tsx          # الرئيسية
│       └── profile/          # الملف الشخصي
├── api/                      # 🔌 API Routes
│   ├── applications/
│   │   ├── apply/            # POST — تقديم طلب
│   │   └── withdraw/         # POST — سحب طلب
│   ├── auth/
│   │   ├── first-login/      # POST — إيميل ترحيبي
│   │   └── reset-password/   # POST — إيميل إعادة تعيين
│   └── send-email/           # POST — إرسال إيميل عام
├── opportunities/            # 📢 الفرص التطوعية
│   ├── page.tsx              # قائمة الفرص
│   └── [id]/page.tsx         # تفاصيل فرصة
├── components/               # 🧱 المكوّنات
│   ├── auth/                 # LoginForm, RegisterForm
│   ├── dashboard/            # Sidebar, StatsCard, etc.
│   ├── landing/              # Hero, Features, etc.
│   ├── layout/               # Navbar, Footer
│   ├── shared/               # LoadingSpinner, etc.
│   └── ui/                   # Button, Input, etc.
├── context/AuthContext.tsx    # 🔑 Auth State Management
├── hooks/                    # 🪝 Custom Hooks
│   ├── useAuth.ts
│   ├── useFirestore.ts
│   └── useRealtime.ts
├── lib/                      # 📚 مكتبات مشتركة
│   ├── firebase.ts           # Client SDK init
│   ├── firebase-admin.ts     # Admin SDK init
│   ├── auth.ts               # Auth functions
│   ├── firestore.ts          # Firestore CRUD
│   ├── email.ts              # Email templates + send
│   └── utils.ts              # Helpers
└── types/index.ts            # 📝 TypeScript Interfaces
```

---

> 📅 آخر تحديث: ٢٣ فبراير ٢٠٢٦
