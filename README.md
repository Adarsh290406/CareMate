<div align="center">

# 💊 CareMate AI

### The AI-Powered Medication Management & Health Adherence Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3-F55036?style=for-the-badge)](https://groq.com/)

**CareMate AI** is a comprehensive, AI-first medication adherence platform built for patients, caregivers, and doctors. It combines real-time health monitoring, computer vision for pill identification, predictive non-adherence analysis, and a full family care ecosystem — all in a sleek, dark-mode progressive web app.

</div>

---

## ✨ Features (64-Feature Roadmap)

### 🤖 AI & Intelligence
| # | Feature | Technology |
|---|---------|-----------|
| 7 | Real-time Risk Score Engine | Groq Llama 3 |
| 8 | Predictive Non-Adherence Detection | Groq AI |
| 9 | Drug Interaction Checker | Groq JSON Mode |
| 11 | Weekly AI Health Narrative | Groq AI |
| 17 | Anomaly Explainer ("Why is my score low?") | Groq AI |
| 18 | Missed Dose Impact Simulator | Groq AI |
| 19 | Personalized Schedule Optimizer | Groq AI |
| 23 | Pill Photo Identification | Gemini 1.5 Flash Vision |
| 25 | Pre-Appointment Doctor Summary | Groq AI |
| 30 | Prescription OCR Scanner | Gemini 1.5 Flash Vision |
| 39 | Medication Encyclopedia | Groq AI |
| 42 | Brand → Generic → Composition Converter | Groq AI |
| 44 | Pill Verification from Photo | Gemini Vision |

### 🏠 Patient Dashboard
- Real-time health & risk scores with animated progress rings
- Daily medication adherence streak tracking
- AI-generated daily briefings
- Smart refill alerts and low-stock warnings
- Emergency SOS with AI-generated paramedic summary
- Voice command mode (mark doses, query schedule)

### 👨‍👩‍👧 Care Ecosystem
- **Family Circle** — Invite caregivers & family members
- **In-App Chat** — Secure messaging between patient & caregiver
- **Remote Medication Management** — Caregivers can view/edit patient meds
- **Live Alerts** — Real-time missed dose notifications across the care network
- **Video Call** — Video link integration for patient-caregiver consultations

### 🏥 Doctor Dashboard
- Population-wide adherence analytics
- Patient risk score surveillance
- Critical intervention AI nudges
- Prescription management & editing
- Patient detail modals with embedded medical history

### 🆘 Emergency Tools
- Emergency QR Medical ID (offline-safe)
- AI-generated paramedic briefing (SOS summary)
- Emergency QR Lockscreen Wallpaper generator
- Public emergency profile URL (`/emergency-profile/:id`)

### 📱 PWA & Accessibility
- Full Progressive Web App with offline support
- Push notification reminders
- Elderly Mode (large fonts, simplified UI)
- Multi-language support (English / Hindi)
- Dark mode with system preference detection
- PDF report export

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v4 + Custom Design System |
| **Animations** | Motion (Framer Motion) |
| **Backend/Database** | Firebase Firestore (real-time) |
| **Auth** | Firebase Authentication |
| **Storage** | Firebase Storage |
| **AI (Vision)** | Google Gemini 1.5 Flash |
| **AI (Logic/Chat)** | Groq Llama 3 70B (8192 ctx) |
| **PWA** | vite-plugin-pwa + Workbox |
| **Charts** | Recharts |
| **PDF** | jsPDF |
| **QR Codes** | qrcode.react |
| **Server** | Express + tsx |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free tier works)
- A Gemini API key (free at Google AI Studio)
- A Groq API key (free at Groq Console)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/caremate-ai.git
cd caremate-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` with your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
APP_URL=http://localhost:3000
```

### 4. Configure Firebase
```bash
cp firebase-applet-config.example.json firebase-applet-config.json
```
Edit `firebase-applet-config.json` with your Firebase project details:
```json
{
  "projectId": "your-project-id",
  "appId": "your-app-id",
  "apiKey": "your-firebase-web-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "your-sender-id",
  "measurementId": ""
}
```

### 5. Deploy Firestore Security Rules
```bash
npx firebase-tools deploy --only firestore:rules
```

### 6. Run the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

---

## 🔑 Getting API Keys

### Gemini API Key (for Vision AI features)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key to `GEMINI_API_KEY` in your `.env`

### Groq API Key (for fast text AI features)
1. Go to [Groq Console](https://console.groq.com/keys)
2. Click **"Create API Key"**
3. Copy the key to `GROQ_API_KEY` in your `.env`

### Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password provider
4. Create a **Firestore Database** (start in test mode, then apply rules)
5. Go to Project Settings → Web App → Copy the config values

---

## 📁 Project Structure

```
caremate-ai/
├── public/                    # PWA assets (icons, manifest)
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── AddMedModal.tsx    # Add medication with AI interaction check
│   │   ├── MainLayout.tsx     # App shell with bottom navigation
│   │   ├── NotificationCenter.tsx  # Real-time alert popover
│   │   ├── Onboarding.tsx     # Multi-step registration (all 3 roles)
│   │   └── PillReminderOverlay.tsx # Dose reminder push overlay
│   ├── hooks/                 # Firebase data hooks
│   │   ├── useAuth.ts         # Auth + profile state
│   │   ├── useMedications.ts  # Real-time medication list
│   │   ├── useMedSchedule.ts  # Real-time dose schedule
│   │   ├── useAlerts.ts       # Real-time alert feed
│   │   └── useRiskScore.ts    # Risk score subscription
│   ├── lib/
│   │   ├── firebase.ts        # Firebase initialization
│   │   ├── gemini.ts          # All AI functions (Gemini + Groq)
│   │   └── utils.ts           # cn() helper
│   ├── pages/                 # Route pages
│   │   ├── Home.tsx           # Patient dashboard
│   │   ├── Meds.tsx           # Medication management
│   │   ├── DoctorDashboard.tsx # Doctor command center
│   │   ├── CaregiverDashboard.tsx # Caregiver care network
│   │   ├── PillScanner.tsx    # Vision AI pill identifier
│   │   ├── PrescriptionOCR.tsx # OCR prescription scanner
│   │   ├── DrugConverter.tsx  # Brand-to-generic converter
│   │   ├── DoseSimulator.tsx  # Missed dose impact simulator
│   │   ├── ScheduleOptimizer.tsx # AI schedule optimizer
│   │   ├── Encyclopedia.tsx   # Medication encyclopedia
│   │   ├── FamilyCircle.tsx   # Family monitoring
│   │   ├── FamilyChat.tsx     # In-app messaging
│   │   ├── VoiceAssistant.tsx # Voice command interface
│   │   ├── EmergencyQR.tsx    # Emergency QR Medical ID
│   │   └── Profile.tsx        # Settings & profile
│   └── services/
│       ├── aiService.ts       # Higher-level AI service layer
│       └── notificationService.ts # Push notification helpers
├── functions/                 # Firebase Cloud Functions
│   └── src/index.ts          # Background tasks (missed dose detection)
├── firestore.rules            # Security rules
├── .env.example               # Environment variable template
├── firebase-applet-config.example.json  # Firebase config template
└── vite.config.ts             # Vite + PWA configuration
```

---

## 👥 User Roles

CareMate supports three distinct user roles, each with tailored onboarding and dashboards:

| Role | Description | Dashboard |
|------|-------------|-----------|
| **Patient** | Primary user managing their medications | Home Dashboard |
| **Caregiver** | Family member/nurse monitoring a patient | Care Network |
| **Doctor** | Healthcare provider with population analytics | Medical Command |

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│              CareMate PWA               │
│         (React + Vite + TSX)            │
└────────────┬────────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
┌────▼────┐    ┌──────▼──────┐
│Firebase │    │   AI Layer  │
│Firestore│    │             │
│  Auth   │    │ Gemini 1.5  │ ← Vision (Pill ID, OCR)
│ Storage │    │   Flash     │
└─────────┘    │             │
               │  Groq Llama │ ← Logic (Risk, Chat, Drugs)
               │    3 70B    │
               └─────────────┘
```

---

## 🔒 Security

- All Firestore reads/writes are protected by security rules (`firestore.rules`)
- API keys are server-side only (never exposed to client)
- Firebase Authentication required for all data access
- Role-based access control for doctor/caregiver data queries
- Emergency QR profile is public but contains only non-sensitive summary data

---

## 🧪 Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # TypeScript type checking
npm run clean    # Remove dist folder
```

---

## 🙏 Acknowledgements

- [Google Gemini](https://deepmind.google/technologies/gemini/) — Vision AI for pill identification & OCR
- [Groq](https://groq.com/) — Ultra-fast LLM inference for real-time health analytics
- [Firebase](https://firebase.google.com/) — Real-time database, authentication, and cloud functions
- [Lucide React](https://lucide.dev/) — Beautiful icon library
- [Motion](https://motion.dev/) — Fluid animations

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">
  Made with ❤️ for better medication adherence
  <br/>
  <strong>CareMate AI</strong> — Taking the guesswork out of health management
</div>
