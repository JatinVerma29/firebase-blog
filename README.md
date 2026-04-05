# ✈️ AERO BLOG — React + Firebase Blogging Platform

> **Agile Engine for Reactive Output** — Built by Jatin Verma (11232673) & Jatin (11232671)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Firebase account (free tier works)

---

## 📁 Project Structure

```
aero-blog/
├── public/
│   └── index.html                  ← HTML entry point
├── src/
│   ├── firebase/
│   │   ├── config.js               ← 🔥 Firebase init (edit this!)
│   │   └── posts.js                ← Firestore + Storage CRUD ops
│   ├── hooks/
│   │   └── usePosts.js             ← Real-time posts hook
│   ├── components/
│   │   ├── Navbar.jsx              ← Fixed glassmorphism navbar
│   │   ├── Hero.jsx                ← Landing hero section
│   │   ├── Features.jsx            ← Features grid
│   │   ├── PostCard.jsx            ← Blog post card
│   │   ├── PostsSection.jsx        ← Posts grid + search + filter
│   │   ├── WriteModal.jsx          ← Write + publish modal (with Storage upload)
│   │   ├── PostReader.jsx          ← Full post reader modal
│   │   └── About.jsx               ← About + Footer
│   ├── styles/
│   │   └── global.css              ← Design system + animations
│   ├── App.jsx                     ← Root component
│   └── index.js                    ← React entry point
├── firestore.rules                 ← Security rules for Firestore
├── storage.rules                   ← Security rules for Storage
├── package.json
└── README.md
```

---

## 🔥 Firebase Setup (5 minutes)

### Step 1 — Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → Name: `aero-blog` → Continue
3. Disable Google Analytics (optional) → **Create project**

### Step 2 — Enable Firestore
1. Left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in test mode** → **Next**
3. Select your nearest region → **Enable**

### Step 3 — Enable Firebase Storage
1. Left sidebar → **Storage** → **Get started**
2. Choose **Start in test mode** → **Next**
3. Select region (same as Firestore) → **Done**

### Step 4 — Enable Authentication (Optional but recommended)
1. Left sidebar → **Authentication** → **Get started**
2. Enable **Email/Password** provider → **Save**
3. Optionally enable **Google** sign-in

### Step 5 — Get Your Config
1. Project Overview → ⚙️ **Project Settings**
2. Scroll to **Your apps** → click `</>` (Web)
3. Register app (name it `aero-blog-web`)
4. Copy the `firebaseConfig` object

### Step 6 — Paste Config into the App
Open `src/firebase/config.js` and replace:

```js
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 💻 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# App opens at http://localhost:3000
```

> **Demo Mode**: If Firebase is not configured, the app automatically loads 6 sample posts so you can see the full UI without any setup.

---

## 🏗️ Build for Production

```bash
npm run build
# Output goes to /build folder
```

---

## ☁️ Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Hosting, use 'build' as public dir, SPA=yes)
firebase init

# Deploy everything
firebase deploy
```

Your app will be live at: `https://your-project.web.app`

---

## 🔐 Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage
```

---

## ✨ Features

| Feature | Technology |
|---|---|
| Real-time posts | Firebase Firestore `onSnapshot` |
| Image upload | Firebase Storage `uploadBytesResumable` |
| Upload progress bar | `uploadTask.on('state_changed')` |
| Like posts | Firestore `updateDoc` |
| Live search | Client-side filter on posts array |
| Category filter | Firestore `where` query |
| Delete posts + images | `deleteDoc` + `deleteObject` |
| Loading skeleton | CSS shimmer animation |
| Scroll reveal | IntersectionObserver |
| Responsive design | CSS Grid + Flexbox |
| Custom fonts | Syne + Lora + DM Mono |

---

## 🎨 Design System

The app uses CSS custom properties (variables) defined in `global.css`:

```css
--blue: #1d4ed8        /* Primary */
--yellow: #f5c518      /* Accent */
--ink: #0c0c14         /* Text */
--bg: #f8faff          /* Background */
--font-display: 'Syne' /* Headings */
--font-body: 'Lora'    /* Body text */
--font-mono: 'DM Mono' /* Code */
```

---

## 📋 Firestore Data Schema

```json
posts/{postId}: {
  "title": "string",
  "author": "string",
  "category": "Technology | Agile | Design | Business | Innovation | Tutorial",
  "content": "string",
  "excerpt": "string (auto-generated)",
  "imageUrl": "string (Firebase Storage URL)",
  "imagePath": "string (Storage path for deletion)",
  "likes": "number",
  "views": "number",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

---

## 👥 Credits

| Name | ID | Role |
|---|---|---|
| Jatin Verma | 11232673 | Lead Developer |
| Jatin | 11232671 | Co-Developer |

**AERO BLOG** — *An Agile Engine for Reactive Output*
