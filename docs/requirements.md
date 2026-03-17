# Software Requirements Specification (SRS)
# Mutatawi Platform

## 1. Introduction
The **Mutatawi** platform is a comprehensive Arabic web platform that aims to facilitate volunteer work by connecting passionate volunteers with organizations and volunteer teams looking for competencies. The platform seeks to organize and facilitate the volunteering process, starting from searching for opportunities to actual joining and evaluation.

## 2. Scope
The scope of the project includes providing a user interface in Arabic (Right-to-Left - RTL), allowing the creation of two types of accounts (Volunteer and Organization). The system covers authentication functions, profile management, custom dashboards, the ability to publish volunteer opportunities, search and apply for them, along with an integrated email notification system.

## 3. User Roles
1. **Volunteer:** Searches for volunteer opportunities, applies for them, and tracks the status of their applications.
2. **Organization:** A volunteer entity or institution that creates volunteer opportunities and manages volunteer applications (accept, reject, communicate).

---

## 4. Functional Requirements

### 4.1. Authentication & Account Management
- **New Account Registration:** The user must be able to register and choose the account type (Volunteer or Organization).
- **Login:** Via email and password, or using a Google account (SSO).
- **Email Verification:** Sending a welcome and verification email upon first registration.
- **Password Recovery:** Providing a mechanism to request a password reset link in case it is forgotten.
- **Profile Completion:** The platform must allow completing profile data after initial registration.

### 4.2. Dashboards
- **Volunteer Dashboard:**
  - View a summary of application statuses (accepted, under review, etc.).
  - Quick access to saved or recommended opportunities.
  - General statistics for the volunteer's participations.
- **Organization Dashboard:**
  - Manage volunteer opportunities (publish, edit, delete, pause).
  - Review applications for each opportunity, and change application statuses (accept, reject).
  - Track the number of remaining spots for each opportunity.

### 4.3. Opportunity Management
- **Publish Opportunities:** Ability to add an opportunity title, description, requirements, targeted skills, location, date and time, and the required number of volunteers.
- **Browse Opportunities (for volunteers and visitors):** Display a list of all available opportunities, with quick search options.
- **Apply for Opportunities:**
  - A simple application form that allows attaching a message/motivation.
  - Ensure that a volunteer does not apply for the same opportunity twice (Unique Document ID).

### 4.4. Email & Notifications
- Sending a welcome email upon first login (First-login).
- Sending an email to the volunteer and the organization confirming receipt of the application.
- Instant notifications within the system using pop-up messages (Toasts).

---

## 5. Non-Functional Requirements

### 5.1. UI/UX
- **Arabic Language Support:** A user interface built mainly on a Right-to-Left (RTL) system using the `Tajawal` font.
- **Responsive Design:** The platform must operate efficiently and be compatible with different screen sizes (phones, tablets, computers).
- **Animations:** Use smooth and interactive animations using `Framer Motion` to enhance user experience.
- **Visual Identity:** Adherence to specific color gradients (Primary Indigo, Success Emerald, Danger Red).

### 5.2. Performance
- High loading speed by leveraging Server-Side Rendering (SSR) and Static Site Generation (SSG) capabilities in the Next.js framework.
- Lazy Loading for images and non-critical components (via the `next/image` feature).

### 5.3. Security
- **Database Rules:** Implement strict rules in `Firestore Rules` to prevent unauthorized access (e.g., preventing volunteers from editing organization opportunities).
- **Route Protection:** Session verification via Next.js middleware.
- **Data Validation:** Use `Zod` for precise input validation (Validation Schemas) on both sides (Client & Server).
- **API Protection:** Ensuring ID Token Verification via `Firebase Admin`.

### 5.4. Reliability & Availability
- Hosting the system on Vercel to ensure high availability and automatic scaling.
- Using a cloud database (Firestore) for fast and reliable handling of live data.

---

## 6. Technology Stack
- **Frontend & SSR (Performance):** Next.js 14, React 18
- **Programming Language:** TypeScript
- **Backend/BaaS:** Firebase (Auth, Firestore)
- **UI Design:** Tailwind CSS, Framer Motion
- **Validation & Form Management:** Zod
- **Email Delivery:** Nodemailer
- **Icons:** React Icons
- **Deployment & Hosting:** Vercel

## 7. System Constraints
- The system requires a 100% active internet connection due to its reliance on cloud services.
- The platform primarily relies on Arabic as the main display language currently.
