# ملخص AI Agent - موقع Mutatawi

## نظرة عامة
نظام مساعد دراسة ذكي متكامل يعتمد على الذكاء الاصطناعي لمساعدة الطلاب في التعلم والمذاكرة.

---

## 📁 البنية المعمارية (Architecture)

### 1. **الصفحة الرئيسية**
- **الموقع:** `app/ai-agent/page.tsx`
- **المكونات:**
  - `AIChatPanel` - واجهة المحادثة الرئيسية
  - `TokenBalanceBar` - شريط عرض رصيد التوكنات
  - `ConversationSidebar` - قائمة المحادثات السابقة

### 2. **المكونات الرئيسية (Components)**

| المكون | الملف | الوظيفة |
|--------|-------|---------|
| `AIChatPanel` | `app/components/ai/AIChatPanel.tsx` | واجهة المحادثة وإرسال الرسائل |
| `StudyModes` | `app/components/ai/StudyModes.tsx` | أوضاع الدراسة (7 أوضاع) |
| `TokenBalanceBar` | `app/components/ai/TokenBalanceBar.tsx` | عرض رصيد التوكنات والحد اليومي |
| `ConversationSidebar` | `app/components/ai/ConversationSidebar.tsx` | عرض المحادثات السابقة |
| `VoiceRecorder` | `app/components/ai/VoiceRecorder.tsx` | التسجيل الصوتي (Web Speech API) |
| `FileAttachment` | `app/components/ai/FileAttachment.tsx` | إرفاق الصور مع ضغط تلقائي |
| `PreviewCard` | `app/components/ai/PreviewCard.tsx` | معاينة المخرجات (مستندات، اختبارات، بطاقات) |

---

## 🎯 أوضاع الدراسة (Study Modes)

```typescript
const modes = [
  { mode: 'explain',     label: 'اشرح',       icon: 🏫 },
  { mode: 'summarize',   label: 'لخّص',       icon: 📋 },
  { mode: 'quiz',        label: 'اختبرني',    icon: ❓ },
  { mode: 'flashcards',  label: 'بطاقات',     icon: 📚 },
  { mode: 'doc',         label: 'Docs',       icon: 📄 },
  { mode: 'slides',      label: 'Slides',     icon: 📊 },
  { mode: 'sheet',       label: 'Sheet',      icon: 📊 },
];
```

### وصف الأوضاع:

| الوضع | الوظيفة | المخرجات |
|-------|---------|----------|
| **chat** | محادثة عامة | نص حر |
| **explain** | شرح مفصل مع أمثلة | نص + صور توضيحية |
| **summarize** | تلخيص النصوص | نقاط موجزة |
| **quiz** | إنشاء اختبارات | JSON (أسئلة متعددة الخيارات) |
| **flashcards** | بطاقات مراجعة | JSON (سؤال/جواب) |
| **doc** | مستند منظم | JSON (أقسام وعناوين) |
| **slides** | عرض تقديمي | JSON (شرائح ونقاط) |
| **sheet** | جدول بيانات | JSON (أعمدة وصفوف) |

---

## 🔧 API Endpoints

### 1. `/api/ai/generate` (POST)
**الوظيفة:** معالجة جميع طلبات الذكاء الاصطناعي

**Pipeline:**
```
1. التحقق من الهوية (Auth) → 
2. التحقق من الحد اليومي (Rate Limit) → 
3. التحقق من رصيد التوكنات → 
4. فحص الكاش (Cache) → 
5. استدعاء API (Kimi/Gemini) → 
6. خصم التوكنات → 
7. حفظ المحادثة → 
8. إرجاع النتيجة
```

**النماذج المستخدمة:**
- **Gemini 2.5 Flash:** للمحادثة، الشرح، التلخيص، الاختبارات، البطاقات
- **Kimi 2.5 (Moonshot):** للمستندات، العروض، الجداول

**System Prompts:**
- كل وضع له prompt مخصص
- يتم فرض قاعدة اللغة العربية
- مخرجات JSON للأوضاع المنظمة (doc, slides, sheet, quiz, flashcards)

**الميزات:**
- **Cache:** تخزين مؤقت للمخرجات المنظمة (1 ساعة)
- **Retry:** إعادة المحاولة عند فشل parsing للـ JSON
- **Image Support:** دعم إرفاق الصور (Multimodal)
- **Grounding:** تفعيل Google Search للمحادثة الحية

---

### 2. `/api/ai/tokens` (GET/POST)

**GET:** جلب رصيد المستخدم وسجل التوكنات
**POST:** إنشاء حساب توكنات جديد للمستخدم

---

## 💰 نظام التوكنات (Token System)

### الثوابت:
```typescript
INTERNAL_TO_REAL_RATIO = 50  // 50 توكن داخلي = 1 حقيقي
INITIAL_TOKENS = 25000        // رصيد ابتدائي (~500 توكن حقيقي)
MAX_TOKENS_PER_REQUEST = 2000
MAX_DAILY_REQUESTS = 20       // حد يومي 20 طلب
LOW_BALANCE_THRESHOLD = 1000  // تنبيه عند الرصيد المنخفض
```

### مكافآت التوكنات:
```typescript
{
  initial: 25000,    // رصيد ترحيبي
  volunteer: 1000,   // مكافأة التطوع
  course: 1000,      // مكافأة الكورس
  referral: 500,     // إحالة صديق
}
```

### Firestore Collections:
- **`aiTokenAccounts`**: حسابات المستخدمين
- **`aiTokenTransactions`**: سجل المعاملات
- **`aiConversations`**: المحادثات المخزنة

---

## 🎨 الميزات التفاعلية

### 1. **المحادثة (Chat Interface)**
- رسائل متبادلة مع avatar
- دعم الكتابة بالعربية والإنجليزية
- عرض الصور المرفقة
- إجراءات لكل رسالة:
  - نسخ النص
  - تحويل لمستند
  - تحويل لعرض تقديمي
  - إعادة توليد

### 2. **التسجيل الصوتي (Voice Input)**
- استخدام Web Speech API
- دعم اللغة العربية
- عرض النص أثناء التسجيل
- إرسال تلقائي عند التوقف

### 3. **إرفاق الصور (Image Attachment)**
- دعم: JPG, PNG, WebP, GIF
- حد أقصى: 5MB
- ضغط تلقائي للصور
- إرسال للـ API للتحليل

### 4. **المعاينة والتحرير (Preview & Edit)**
- **Docs:** محرر مستندات مع تحميل
- **Slides:** معاينة العرض + تحميل PDF
- **Sheets:** جدول بيانات قابل للتصدير
- **Quiz:** وضع اختبار تفاعلي
- **Flashcards:** بطاقات قابلة للقلب

---

## 📊 تدفق العمل (Workflow)

### إرسال رسالة:
```
1. المستخدم يكتب رسالة أو يختار وضع دراسة
2. إرفاق صور (اختياري)
3. التحقق من الرصيد محلياً
4. إرسال إلى /api/ai/generate
5. التحقق من الهوية والتوكنات في الخادم
6. استدعاء Kimi/Gemini API
7. معالجة المخرجات (Parsing JSON إن وجد)
8. خصم التوكنات من الحساب
9. حفظ المحادثة في Firestore
10. عرض النتيجة للمستخدم
```

### إنشاء محادثة جديدة:
```
1. الضغط على "محادلة جديدة"
2. تصفير conversationId
3. بدء محادثة جديدة في الواجهة
4. عند أول رسالة، يتم إنشاء وثيقة aiConversations جديدة
5. ربط الرسائل بالمحادثة عبر subcollection
```

---

## 🔐 الأمان والصلاحيات

### التحقق من الهوية:
- Firebase Authentication
- JWT Token في كل طلب
- `adminAuth.verifyIdToken()` في الخادم

### Super Admin:
- مستخدمين بـ `role: 'super_admin'` في `adminEmails`
- توكنات غير محدودة
- تجاوز الحد اليومي

### Firestore Rules:
- كل مستخدم يصل فقط لبياناته
- `aiConversations.userId == auth.uid`
- `aiTokenAccounts.userId == auth.uid`

---

## 🗂️ قاعدة البيانات (Firestore Schema)

### `aiConversations`:
```typescript
{
  userId: string,
  title: string,
  messageCount: number,
  tokensUsed: number,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  messages: subcollection<{
    role: 'user' | 'assistant',
    content: string,
    type: StudyMode,
    tokensUsed?: number,
    structuredData?: any,
    timestamp: Timestamp
  }>
}
```

### `aiTokenAccounts`:
```typescript
{
  userId: string,
  email: string,
  displayName: string,
  totalTokens: number,
  usedTokens: number,
  remainingTokens: number,
  dailyRequestCount: number,
  dailyResetDate: string,
  lastUsed: Timestamp | null,
  suspended: boolean
}
```

### `aiTokenTransactions`:
```typescript
{
  userId: string,
  type: 'initial' | 'usage' | 'volunteer' | 'course' | 'referral' | 'admin_grant',
  amount: number,  // موجب للإضافة، سالب للاستخدام
  description: string,
  timestamp: Timestamp
}
```

---

## 🌐 التقنيات المستخدمة

| الفئة | التقنية |
|-------|---------|
| **Frontend** | Next.js 14, React, TypeScript |
| **Styling** | TailwindCSS |
| **Animation** | Framer Motion |
| **Icons** | React Icons (Ionicons) |
| **Backend** | Next.js API Routes |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **AI Models** | Gemini 2.5 Flash, Kimi 2.5 (Moonshot) |
| **Image Gen** | Pollinations.ai (للتوليد داخل الشات) |
| **Voice** | Web Speech API |

---

## 📱 الاستجابة (Responsive Design)

- **Desktop (>1024px):** Sidebar ثابت + شريط أدوات كامل
- **Tablet/Mobile:** Sidebar قابل للطي + شريط أدوات مبسط
- Mobile-first approach مع تحسينات للشاشات الكبيرة

---

## 🔮 الميزات المتقدمة

### 1. **توليد الصور التلقائي**
- عند الشرح، يمكن للنموذج توليد صور عبر Pollinations.ai
- الصيغة: `![desc](https://image.pollinations.ai/prompt/description)`

### 2. **Google Search Grounding**
- مفعّل للمحادثة الحية
- يجلب معلومات محدثة من الويب
- غير مفعّل مع الصور (لتجنب أخطاء API)

### 3. **التخزين المؤقت (Caching)**
- تخزين المخرجات المنظمة لمدة ساعة
- تقليل استهلاك التوكنات للمكررات
- حد أقصى: 100 مدخنة في الكاش

### 4. **إصلاح JSON التلقائي**
- معالجة الأسطر الجديدة غير المهروبة
- استخراج JSON من markdown code blocks
- Retry بـ stricter prompt عند الفشل

---

## 🐛 معالجة الأخطاء

| الخطأ | السبب | المعالجة |
|-------|-------|----------|
| `401` | مفتاح API غير صالح | رسالة "تواصل مع الإدارة" |
| `429` | نفاد رصيد API | رسالة "خدمة غير متاحة" |
| `رصيد منخفض` | توكنات غير كافية | توجيه لصفحة الفرص |
| `JSON parsing failed` | مخرجات غير صالحة | Retry + رسالة خطأ |

---

## 📈 الإحصائيات والأداء

- **حد المحادثة:** 50 رسالة كحد أقصى
- **حد الشرائح:** 8 شرائح كحد أقصى
- **حد المستند:** 6 أقسام كحد أقصى
- **الاختبارات:** 5-10 أسئلة
- **البطاقات:** 10-15 بطاقة

---

## 🚀 التطوير المستقبلي (اقتراحات)

1. **تحسين الكاش:** استخدام Redis بدلاً من in-memory
2. **Streaming:** عرض الإجابة أثناء التوليد
3. **مزيد من النماذج:** إضافة Claude/GPT كـ fallback
4. **تحليل الصور المتقدم:** OCR للنصوص العربية
5. **تصدير PDF:** تحميل مباشر للمستندات والعروض
6. **إشعارات:** تنبيه عند نفاد التوكنات

---

## 📞 نقاط الاتصال الرئيسية

```
/app/ai-agent              → صفحة المساعد
/api/ai/generate           → توليد المحتوى
/api/ai/tokens             → إدارة التوكنات
/firestore/aiConversations → المحادثات
/firestore/aiTokenAccounts → حسابات التوكنات
```

---

**تم الإنشاء:** 2026-04-08  
**المطور:** Mutatawi Team
