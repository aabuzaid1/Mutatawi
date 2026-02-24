# 🔄 Mutatawi Platform — Systems Flow Documentation

> This document outlines the data flow and operations for all systems in the Mutatawi volunteering platform.

---

## 📋 Systems Index

| # | System | Description |
|---|--------|-------------|
| 1 | [Authentication](#1--authentication-system) | Sign up, sign in, Google OAuth, password reset |
| 2 | [Opportunities](#2--opportunities-system) | Create, list, edit, delete, auto-expiration |
| 3 | [Applications](#3--applications-system) | Apply, withdraw, accept, reject |
| 4 | [Email Notifications](#4--email-notifications) | 6 email types via Gmail SMTP |
| 5 | [Dashboards](#5--dashboards) | Organization + Volunteer dashboards |
| 6 | [Data Layer](#6--data-layer) | Firebase Firestore + Custom Hooks |
| 7 | [Infrastructure](#7--infrastructure) | Firebase Client/Admin SDK + Vercel |

---

## 1. 🔐 Authentication System

### General Flow

```mermaid
flowchart TD
    A[Visitor] --> B{Has an account?}
    B -->|Yes| C["/login — Sign In"]
    B -->|No| D["/register — Create Account"]
    
    C --> C1{Sign-in method}
    C1 -->|Email/Password| C2["signIn()"]
    C1 -->|Google| C3["signInWithGoogle()"]
    
    D --> D1["signUp(email, password, name, role)"]
    D1 --> D2["createUserWithEmailAndPassword()"]
    D2 --> D3["Create Profile in Firestore"]
    D3 --> D4["sendEmailVerification()"]
    D4 --> D5["triggerFirstLoginEmail()"]
    D5 --> E["/verify-email"]
    
    C2 --> F{Success?}
    C3 --> F
    F -->|Yes| G["AuthContext loads Profile"]
    G --> H{Account type}
    H -->|Volunteer| I["/volunteer"]
    H -->|Organization| J["/organization"]
    F -->|No| K["Error message"]
```

### Password Reset Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FP as /forgot-password
    participant API as /api/auth/reset-password
    participant Admin as Firebase Admin SDK
    participant SMTP as Gmail SMTP
    participant RP as /reset-password
    participant FB as Firebase Auth

    U->>FP: Enters email
    FP->>API: POST {email}
    API->>Admin: generatePasswordResetLink(email)
    Admin-->>API: Firebase Link with oobCode
    API->>API: Extract oobCode + build direct link
    API->>SMTP: Send Arabic email with link
    SMTP-->>U: 📧 Password reset email
    U->>RP: Clicks link /?oobCode=ABC
    RP->>FB: verifyPasswordResetCode(oobCode)
    FB-->>RP: User email address
    RP->>U: New password form + Strength Meter
    U->>RP: Enters new password
    RP->>FB: confirmPasswordReset(oobCode, newPassword)
    FB-->>RP: ✅ Password changed
    RP->>U: Redirect to /login
```

### System Files

| File | Purpose |
|------|---------|
| `app/lib/firebase.ts` | Firebase Client SDK initialization |
| `app/lib/auth.ts` | signUp, signIn, signOut, resetPassword, etc. |
| `app/context/AuthContext.tsx` | AuthProvider + onAuthStateChanged listener |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/register/page.tsx` | Registration page |
| `app/(auth)/forgot-password/page.tsx` | Forgot password page |
| `app/(auth)/reset-password/page.tsx` | Set new password page |
| `app/(auth)/verify-email/page.tsx` | Email verification page |
| `app/(auth)/complete-profile/page.tsx` | Profile completion page |
| `app/api/auth/reset-password/route.ts` | API — send reset email via SMTP |
| `app/api/auth/first-login/route.ts` | API — send welcome email |

---

## 2. 📢 Opportunities System

### Opportunity Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Organization creates opportunity
    Draft --> Open: Publish opportunity
    Open --> Closed: Spots full or manual close
    Open --> Expired: End date has passed
    Open --> Completed: Organization confirms completion
    Closed --> Open: Reopen
    Expired --> [*]: Hidden from public listing
    Completed --> [*]

    note right of Expired
        Remains visible in:
        - Organization dashboard
        - Volunteer application history
    end note
```

### Create Opportunity Flow

```mermaid
flowchart TD
    A["Organization → /organization/post-opportunity"] --> B["Fill form"]
    B --> C{"Upload image?"}
    C -->|Yes| D["uploadBytes() → Firebase Storage"]
    D --> E["getDownloadURL()"]
    C -->|No| F["No image"]
    E --> G["createOpportunity()"]
    F --> G
    G --> H["addDoc() → Firestore/opportunities"]
    H --> I["✅ Opportunity live at /opportunities"]
```

### Browse & Filter Opportunities

```mermaid
flowchart LR
    A["/opportunities"] --> B["getOpportunities(filters)"]
    B --> C{Filters}
    C --> D["category: Education/Health/Environment/..."]
    C --> E["location: City/Region"]
    C --> F["status: open"]
    C --> G["excludePast: true"]
    B --> H["Render cards with Framer Motion"]
    H --> I["Click card → /opportunities/[id]"]
    I --> J["getOpportunity(id)"]
    J --> K["Detail page + Apply button"]
```

### System Files

| File | Purpose |
|------|---------|
| `app/lib/firestore.ts` | createOpportunity, getOpportunities, updateOpportunity, deleteOpportunity |
| `app/opportunities/page.tsx` | All opportunities listing with filters |
| `app/opportunities/[id]/page.tsx` | Single opportunity details |
| `app/(dashboard)/organization/post-opportunity/page.tsx` | Post new opportunity |
| `app/(dashboard)/organization/edit-opportunity/page.tsx` | Edit opportunity |

---

## 3. 📝 Applications System

### Application Flow

```mermaid
sequenceDiagram
    participant V as Volunteer
    participant UI as Opportunity Page
    participant API as /api/applications/apply
    participant Admin as Firebase Admin
    participant DB as Firestore
    participant Email as SMTP

    V->>UI: Clicks "Apply"
    UI->>API: POST {opportunityId} + Bearer Token
    API->>Admin: verifyIdToken(token)
    Admin-->>API: Volunteer UID
    
    API->>DB: Already applied? (Composite ID check)
    DB-->>API: No
    
    API->>DB: Fetch opportunity data
    API->>DB: Fetch volunteer data
    API->>DB: Fetch organization data
    
    API->>DB: Create Application document
    API->>DB: spotsFilled += 1
    
    par Parallel emails
        API->>Email: Confirmation email to volunteer ✅
        API->>Email: Notification email to organization 📩
    end
    
    API-->>UI: {success: true}
    UI-->>V: 🎉 Application submitted!
```

### Application States

```mermaid
stateDiagram-v2
    [*] --> Pending: Volunteer applies
    Pending --> Accepted: Organization accepts
    Pending --> Rejected: Organization rejects
    Pending --> Withdrawn: Volunteer withdraws
    Accepted --> [*]: 📧 "Congratulations!" email
    Rejected --> [*]: 📧 "Application update" email
    Withdrawn --> [*]: spotsFilled -= 1
```

### System Files

| File | Purpose |
|------|---------|
| `app/api/applications/apply/route.ts` | Apply API (token-protected) |
| `app/api/applications/withdraw/route.ts` | Withdraw API |
| `app/lib/firestore.ts` | createApplication, updateApplicationStatus, withdrawApplication |
| `app/(dashboard)/organization/applicants/page.tsx` | Manage applicants |

---

## 4. 📧 Email Notifications

### Email Types

```mermaid
flowchart TD
    subgraph "Automated Emails"
        A["🎉 Welcome — New user registration"] --> SMTP
        B["✅ Application Confirmation — To volunteer"] --> SMTP
        C["📩 New Application — To organization"] --> SMTP
        D["🏆 Application Accepted — To volunteer"] --> SMTP
        E["📝 Application Rejected — To volunteer"] --> SMTP
        F["🔑 Password Reset — To user"] --> SMTP
    end

    SMTP["Gmail SMTP via Nodemailer"]
    SMTP --> G["📬 User Inbox"]

    style SMTP fill:#4285F4,color:#fff
```

### Email Template Structure

```mermaid
flowchart TD
    A["emailLayout()"] --> B["Logo + Brand Bar"]
    B --> C["Header Banner — Icon + Title + Color"]
    C --> D["Body Content — Dynamic HTML"]
    D --> E["CTA Button — ctaButton()"]
    E --> F["Footer — Copyright + Site Link"]
    
    style A fill:#6366f1,color:#fff
```

### System Files

| File | Purpose |
|------|---------|
| `app/lib/email.ts` | Template engine + 5 email functions |
| `app/api/auth/reset-password/route.ts` | Password reset email |
| `app/api/auth/first-login/route.ts` | Welcome email |
| `.env.local` | SMTP_EMAIL + SMTP_PASSWORD |

---

## 5. 📊 Dashboards

### Organization Dashboard

```mermaid
flowchart TD
    A["/organization"] --> B["Organization Stats"]
    A --> C["Published Opportunities List"]
    
    C --> D["Post New Opportunity"]
    C --> E["Edit Opportunity"]
    C --> F["Delete Opportunity"]
    C --> G["View Applicants"]
    
    G --> H["Accept Volunteer"]
    G --> I["Reject Volunteer"]
    
    H --> J["📧 Acceptance Email"]
    I --> K["📧 Rejection Email"]
    
    B --> L["Total opportunities posted"]
    B --> M["Pending applications count"]
    B --> N["Accepted volunteers count"]
```

### Volunteer Dashboard

```mermaid
flowchart TD
    A["/volunteer"] --> B["Volunteer Stats"]
    A --> C["My Applications"]
    A --> D["Profile"]
    
    C --> E["Pending 🟡"]
    C --> F["Accepted 🟢"]
    C --> G["Rejected 🔴"]
    C --> H["Withdraw ❌"]
    
    D --> I["/volunteer/profile"]
    I --> J["Edit name & details"]
    I --> K["Change password"]
    
    B --> L["Total applications"]
    B --> M["Volunteer hours"]
    B --> N["Completed opportunities"]
```

### System Files

| File | Purpose |
|------|---------|
| `app/(dashboard)/layout.tsx` | Shared dashboard layout |
| `app/(dashboard)/organization/page.tsx` | Organization main dashboard |
| `app/(dashboard)/organization/applicants/page.tsx` | Manage applicants |
| `app/(dashboard)/organization/post-opportunity/page.tsx` | Post opportunity |
| `app/(dashboard)/organization/edit-opportunity/page.tsx` | Edit opportunity |
| `app/(dashboard)/volunteer/page.tsx` | Volunteer main dashboard |
| `app/(dashboard)/volunteer/profile/page.tsx` | Profile page |

---

## 6. 💾 Data Layer

### Data Model (Entity Relationship Diagram)

```mermaid
erDiagram
    users ||--o{ opportunities : "publishes (organization)"
    users ||--o{ applications : "applies (volunteer)"
    opportunities ||--o{ applications : "has applications"
    opportunities ||--o{ feedbacks : "has feedback"
    users ||--o{ feedbacks : "writes (volunteer)"

    users {
        string uid PK
        string email
        string displayName
        string role "volunteer | organization"
        string phone
        string bio
        string location
        string[] skills
        date createdAt
    }

    opportunities {
        string id PK
        string title
        string organizationId FK
        string category "8 categories"
        string location
        string status "open | closed | completed"
        number spotsTotal
        number spotsFilled
        string date
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

### Hooks & Data Access Patterns

```mermaid
flowchart LR
    subgraph "Client-Side Hooks"
        A["useAuth()"] --> B["AuthContext"]
        C["useFirestore()"] --> D["Firestore fetch/add/update/delete"]
        E["useRealtime()"] --> F["onSnapshot listener"]
    end

    subgraph "Server-Side Functions"
        G["firestore.ts"] --> H["Direct Firestore CRUD"]
        I["firebase-admin.ts"] --> J["Admin SDK — verify tokens, manage users"]
    end

    B --> K[(Firebase Auth)]
    D --> L[(Firestore)]
    F --> L
    H --> L
    J --> K
```

---

## 7. 🏗️ Infrastructure

### Deployment Architecture

```mermaid
flowchart TD
    subgraph "Client — Browser"
        A["Next.js 14 App Router"]
        B["Firebase Client SDK"]
        C["Framer Motion Animations"]
        D["Tailwind CSS"]
    end

    subgraph "Server — Vercel Serverless"
        E["API Routes — Node.js"]
        F["Firebase Admin SDK"]
        G["Nodemailer SMTP"]
    end

    subgraph "Firebase Cloud"
        H[(Authentication)]
        I[(Firestore Database)]
        J[(Cloud Storage)]
    end

    subgraph "External Services"
        K["Gmail SMTP"]
    end

    A --> B
    A --> E
    B --> H
    B --> I
    B --> J
    E --> F
    F --> H
    F --> I
    E --> G
    G --> K
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Cloud Storage |
| Email | Nodemailer + Gmail SMTP |
| Icons | React Icons (Ionicons) |
| Toasts | React Hot Toast |
| Hosting | Vercel |
| Admin SDK | firebase-admin |

### Directory Structure

```
app/
├── (auth)/                   # 🔐 Authentication Pages
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── verify-email/
│   └── complete-profile/
├── (dashboard)/              # 📊 Dashboards
│   ├── organization/
│   │   ├── page.tsx          # Main dashboard
│   │   ├── applicants/       # Manage applicants
│   │   ├── post-opportunity/ # Post opportunity
│   │   └── edit-opportunity/ # Edit opportunity
│   └── volunteer/
│       ├── page.tsx          # Main dashboard
│       └── profile/          # User profile
├── api/                      # 🔌 API Routes
│   ├── applications/
│   │   ├── apply/            # POST — Submit application
│   │   └── withdraw/         # POST — Withdraw application
│   ├── auth/
│   │   ├── first-login/      # POST — Welcome email
│   │   └── reset-password/   # POST — Password reset email
│   └── send-email/           # POST — General email
├── opportunities/            # 📢 Volunteer Opportunities
│   ├── page.tsx              # Opportunities listing
│   └── [id]/page.tsx         # Opportunity details
├── components/               # 🧱 Reusable Components
│   ├── auth/                 # LoginForm, RegisterForm
│   ├── dashboard/            # Sidebar, StatsCard, etc.
│   ├── landing/              # Hero, Features, etc.
│   ├── layout/               # Navbar, Footer
│   ├── shared/               # LoadingSpinner, etc.
│   └── ui/                   # Button, Input, etc.
├── context/AuthContext.tsx    # 🔑 Auth State Management
├── hooks/                    # 🪝 Custom React Hooks
│   ├── useAuth.ts
│   ├── useFirestore.ts
│   └── useRealtime.ts
├── lib/                      # 📚 Shared Libraries
│   ├── firebase.ts           # Client SDK init
│   ├── firebase-admin.ts     # Admin SDK init
│   ├── auth.ts               # Auth functions
│   ├── firestore.ts          # Firestore CRUD
│   ├── email.ts              # Email templates + send
│   └── utils.ts              # Helper utilities
└── types/index.ts            # 📝 TypeScript Interfaces
```

---

> 📅 Last updated: February 23, 2026
