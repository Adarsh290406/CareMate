# 🛠️ CareMate AI — Setup Guide

A step-by-step guide to get CareMate running locally and deploying it to production.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | Comes with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com/) |
| Firebase CLI | Latest | `npm install -g firebase-tools` |

---

## Step 1: Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/caremate-ai.git
cd caremate-ai
npm install
```

---

## Step 2: Get API Keys

### 🟦 Google Gemini API Key
> Used for Vision AI tasks — Pill Identification and Prescription OCR

1. Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** → Select a Google Cloud project
4. Copy the key — you'll need it in Step 4

### 🟧 Groq API Key
> Used for high-speed AI — risk scores, drug info, chat, drug interactions

1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up / Sign in
3. Click **"Create API Key"**
4. Copy the key — you'll need it in Step 4

---

## Step 3: Firebase Project Setup

> **💡 Cloning on a New PC?**
> You do **NOT** need to create a new Firebase project. Firebase is cloud-hosted — your database, users, and all data live in Google's cloud, not on your local machine.
>
> If you already have a Firebase project set up, just copy your `firebase-applet-config.json` and `.env` files to the new machine and **skip this step entirely**.
> Only follow this step if you are setting up CareMate for the very first time.

---


1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"** → Name it (e.g. `caremate-ai`) → Continue
3. Disable Google Analytics (optional) → **Create Project**

### Enable Authentication
1. In the left sidebar: **Build → Authentication**
2. Click **"Get Started"**
3. Enable **Email/Password** provider → Save

### Create Firestore Database
1. In the left sidebar: **Build → Firestore Database**
2. Click **"Create Database"**
3. Select **"Start in test mode"** (we'll apply proper rules later)
4. Choose a region → **Done**

### Get Firebase Config
1. In Project Overview, click the **Web icon** `</>`
2. Register your app (nickname: `caremate-web`)
3. Copy the config values — you'll need them in Step 4

---

## Step 4: Configure the App

### Create Environment File
```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=paste_your_gemini_key_here
GROQ_API_KEY=paste_your_groq_key_here
APP_URL=http://localhost:3000
```

### Create Firebase Config File
```bash
cp firebase-applet-config.example.json firebase-applet-config.json
```

Edit `firebase-applet-config.json` with your Firebase project values:
```json
{
  "projectId": "your-project-id",
  "appId": "1:XXXX:web:XXXX",
  "apiKey": "AIzaSyXXXXXXXXXXXXXXXX",
  "authDomain": "your-project.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "123456789",
  "measurementId": ""
}
```

> **Note:** The Firebase web `apiKey` in the config file is a **public key** — it's safe to include. Security is enforced by Firestore Rules, not this key.

---

## Step 5: Deploy Firestore Security Rules

```bash
# Login to Firebase
npx firebase-tools login

# Select your project
npx firebase-tools use YOUR_PROJECT_ID

# Deploy the rules
npx firebase-tools deploy --only firestore:rules
```

This deploys `firestore.rules` which protects all user data.

---

## Step 6: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 7: First Login

1. Click **"Register"** → Choose role: **Patient**
2. Complete the 3-step onboarding (name, health profile, emergency contacts)
3. You'll land on the Patient Dashboard

### Test Accounts to Create
| Role | Email | Password |
|------|-------|---------|
| Patient | patient@test.com | Test@1234 |
| Caregiver | caregiver@test.com | Test@1234 |
| Doctor | doctor@test.com | Test@1234 |

---

## Production Build

```bash
npm run build
npm run start
```

---

## Deploy to Firebase Hosting (Optional)

```bash
# Build the app
npm run build

# Deploy to Firebase
npx firebase-tools deploy --only hosting
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API for Vision AI |
| `GROQ_API_KEY` | ✅ Yes | Groq API for fast text AI |
| `APP_URL` | Optional | App URL for metadata (default: localhost:3000) |

---

## Common Issues

### "Missing or insufficient permissions" in Firestore
→ Make sure you've deployed the security rules (Step 5)

### "AI service offline" on drug features
→ Check that your `GROQ_API_KEY` is set correctly in `.env`

### Pill scanner / OCR not working
→ Check that your `GEMINI_API_KEY` is set and has Vision API access enabled

### App won't start (port in use)
→ Another instance is already running. Kill it or change the port in `server.ts`

---

## Firebase Cloud Functions (Optional — for background alerts)

The `functions/` folder contains background jobs for:
- Detecting missed doses hourly
- Sending push notifications to patients and caregivers

To deploy:
```bash
cd functions
npm install
cd ..
npx firebase-tools deploy --only functions
```

> Requires Firebase Blaze (pay-as-you-go) plan for Cloud Functions.
