# 💊 CareMate AI

> An AI-first medication adherence platform for patients, caregivers, and doctors — combining real-time health monitoring, computer vision pill identification, predictive non-adherence detection, and a full family care ecosystem.

![React](https://img.shields.io/badge/React_19-TypeScript-blue?logo=react) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase) ![Gemini](https://img.shields.io/badge/Gemini_1.5_Flash-Vision-purple?logo=google) ![Groq](https://img.shields.io/badge/Groq-Llama_3_70B-green) ![PWA](https://img.shields.io/badge/PWA-Offline_Ready-blueviolet)

---

## 🌍 The Problem

Medication non-adherence costs the healthcare system billions annually and is a leading cause of preventable hospitalizations. For elderly patients, chronic disease sufferers, and families managing care across distances — tracking medications, identifying pills, and catching missed doses before they become emergencies is brutally hard.

CareMate AI solves this end-to-end: from pill identification via camera to AI-predicted non-adherence before it happens.

---

## ✨ Key Features

### 🤖 AI & Intelligence

| # | Feature | Model |
|---|---|---|
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
- **In-App Chat** — Secure messaging between patient and caregiver
- **Remote Medication Management** — Caregivers can view/edit patient medications
- **Live Alerts** — Real-time missed dose notifications across the care network
- **Video Call** — Video link integration for patient-caregiver consultations

### 🏥 Doctor Dashboard

- Population-wide adherence analytics
- Patient risk score surveillance
- Critical intervention AI nudges
- Prescription management and editing
- Patient detail modals with embedded medical history

### 🆘 Emergency Tools

- Emergency QR Medical ID (offline-safe)
- AI-generated paramedic briefing on SOS trigger
- Emergency QR Lockscreen Wallpaper generator
- Public emergency profile URL (`/emergency-profile/:id`)

### 📱 PWA & Accessibility

- Full Progressive Web App with offline support
- Push notification reminders
- Elderly Mode — large fonts, simplified UI
- Multi-language support (English / Hindi)
- Dark mode with system preference detection
- PDF report export

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Custom Design System |
| Animations | Motion (Framer Motion) |
| Backend / Database | Firebase Firestore (real-time) |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| AI — Vision | Google Gemini 1.5 Flash |
| AI — Logic / Chat | Groq Llama 3 70B (8192 ctx) |
| PWA | vite-plugin-pwa + Workbox |
| Charts | Recharts |
| PDF | jsPDF |
| QR Codes | qrcode.react |
| Server | Express + tsx |

---

## 👥 User Roles

CareMate supports three distinct roles, each with tailored onboarding and a dedicated dashboard:

| Role | Description | Dashboard |
|---|---|---|
| **Patient** | Primary user managing their own medications | Home Dashboard |
| **Caregiver** | Family member or nurse monitoring a patient remotely | Care Network |
| **Doctor** | Healthcare provider with population-level analytics | Medical Command |

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (free tier works)
- A Gemini API key — [Get one free at Google AI Studio](https://aistudio.google.com/)
- A Groq API key — [Get one free at Groq Console](https://console.groq.com/)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/caremate-ai.git
cd caremate-ai
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
APP_URL=http://localhost:3000
```

### 3. Configure Firebase

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

### 4. Deploy Firestore Security Rules

```bash
npx firebase-tools deploy --only firestore:rules
```

### 5. Run

```bash
npm run dev
# App available at http://localhost:3000
```

---

## 🔑 API Key Setup

**Gemini (Vision AI — pill identification & OCR)**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **Create API Key**
3. Paste into `GEMINI_API_KEY` in your `.env`

**Groq (Fast text AI — risk scores, chat, drug interactions)**
1. Go to [Groq Console](https://console.groq.com/)
2. Click **Create API Key**
3. Paste into `GROQ_API_KEY` in your `.env`

**Firebase**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication → Email/Password**
4. Create a **Firestore Database** (start in test mode, then apply the included rules)
5. Go to **Project Settings → Web App** and copy the config values

---

## 📁 Project Structure

```
caremate-ai/
├── public/                         # PWA assets (icons, manifest)
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── AddMedModal.tsx         # Add medication with AI interaction check
│   │   ├── MainLayout.tsx          # App shell with bottom navigation
│   │   ├── NotificationCenter.tsx  # Real-time alert popover
│   │   ├── Onboarding.tsx          # Multi-step registration (all 3 roles)
│   │   └── PillReminderOverlay.tsx # Dose reminder push overlay
│   ├── hooks/                      # Firebase real-time data hooks
│   │   ├── useAuth.ts
│   │   ├── useMedications.ts
│   │   ├── useMedSchedule.ts
│   │   ├── useAlerts.ts
│   │   └── useRiskScore.ts
│   ├── lib/
│   │   ├── firebase.ts             # Firebase initialization
│   │   ├── gemini.ts               # All AI functions (Gemini + Groq)
│   │   └── utils.ts                # Utility helpers
│   ├── pages/
│   │   ├── Home.tsx                # Patient dashboard
│   │   ├── Meds.tsx                # Medication management
│   │   ├── DoctorDashboard.tsx     # Doctor command center
│   │   ├── CaregiverDashboard.tsx  # Caregiver care network
│   │   ├── PillScanner.tsx         # Vision AI pill identifier
│   │   ├── PrescriptionOCR.tsx     # OCR prescription scanner
│   │   ├── DrugConverter.tsx       # Brand-to-generic converter
│   │   ├── DoseSimulator.tsx       # Missed dose impact simulator
│   │   ├── ScheduleOptimizer.tsx   # AI schedule optimizer
│   │   ├── Encyclopedia.tsx        # Medication encyclopedia
│   │   ├── FamilyCircle.tsx        # Family monitoring
│   │   ├── FamilyChat.tsx          # In-app messaging
│   │   ├── VoiceAssistant.tsx      # Voice command interface
│   │   ├── EmergencyQR.tsx         # Emergency QR Medical ID
│   │   └── Profile.tsx             # Settings & profile
│   └── services/
│       ├── aiService.ts            # Higher-level AI service layer
│       └── notificationService.ts  # Push notification helpers
├── functions/
│   └── src/index.ts                # Firebase Cloud Functions (missed dose detection)
├── firestore.rules                 # Firestore security rules
├── .env.example                    # Environment variable template
├── firebase-applet-config.example.json
└── vite.config.ts                  # Vite + PWA configuration
```

---

## 🔒 Security

- All Firestore reads/writes enforced by `firestore.rules`
- API keys are server-side only — never exposed to the client
- Firebase Authentication required for all data access
- Role-based access control for doctor/caregiver data queries
- Emergency QR profile is public but contains only non-sensitive summary data

---

## 🧪 Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # TypeScript type checking
npm run clean    # Remove dist folder
```

---

## 🙏 Acknowledgements

- [Google Gemini](https://deepmind.google/technologies/gemini/) — Vision AI for pill identification and OCR
- [Groq](https://groq.com/) — Ultra-fast LLM inference for real-time health analytics
- [Firebase](https://firebase.google.com/) — Real-time database, auth, and cloud functions
- [Lucide React](https://lucide.dev/) — Icon library
- [Motion](https://motion.dev/) — Animation library

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*CareMate AI — Taking the guesswork out of health management.*
