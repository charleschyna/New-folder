# EchoTutor 🎓
### Voice-First AI Learning Platform with Talking Avatar Tutor

> *"Learning that feels human."*

EchoTutor is a full-stack AI-powered tutoring platform where a talking avatar named **Echo** teaches students through voice conversation, a live whiteboard, and real-time interruption handling — like a real personal tutor.

---

## ✨ Feature Overview

| Feature | Status |
|---|---|
| Personalised login + JWT auth | ✅ |
| Warm greeting by name (spoken) | ✅ |
| CSS talking avatar (lip-sync) | ✅ |
| D-ID avatar streaming (with API key) | ✅ |
| AI lesson generation (GPT-4o) | ✅ |
| Demo mode (no API key needed) | ✅ |
| Animated whiteboard (typewriter effect) | ✅ |
| Voice recognition + commands | ✅ |
| Live interruption handling | ✅ |
| High contrast, large text, dyslexia font | ✅ |
| Learning history + progress tracking | ✅ |
| Docker deployment | ✅ |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  AvatarPlayer│  │WhiteboardCanvas│  │  VoiceController  │  │
│  │  (D-ID/CSS) │  │  (Canvas API)│  │  (Web Speech API) │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                │                    │              │
│  ┌──────┴────────────────┴────────────────────┴──────────┐  │
│  │            LessonContext (React Context)               │  │
│  │        startLesson · handleInterruption · handleCommand│  │
│  └──────────────────────────┬────────────────────────────┘  │
│                              │ axios                          │
└──────────────────────────────┼─────────────────────────────-─┘
                               │ HTTP / REST
┌──────────────────────────────▼──────────────────────────────┐
│                    DJANGO BACKEND                             │
│  /api/auth/    /api/lessons/    /api/ai/                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              apps.ai_engine.teaching_engine          │    │
│  │    generate_lesson · respond_to_interruption         │    │
│  │    handle_command · generate_greeting                │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                         │
└─────────────────────┼───────────────────────────────────────┘
                      │ OpenAI API
              ┌───────▼───────┐      ┌──────────────┐
              │  GPT-4o       │      │  Neon/Postgres│
              │  LLM Engine   │      │  Database     │
              └───────────────┘      └──────────────┘
```

## 📦 Project Structure

```
echotutor/
├── backend/
│   ├── echotutor/
│   │   ├── settings.py          # Django config + JWT + CORS
│   │   ├── urls.py              # Root URL routing
│   │   ├── asgi.py              # ASGI + Channels setup
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── authentication/
│   │   │   ├── models.py        # Custom User model + accessibility fields
│   │   │   ├── serializers.py   # Register, profile, accessibility
│   │   │   ├── views.py         # Register, login, logout, profile
│   │   │   └── urls.py
│   │   ├── lessons/
│   │   │   ├── models.py        # LessonSession, Subject, LearningProgress
│   │   │   ├── views.py         # CRUD sessions, history, progress
│   │   │   └── urls.py
│   │   └── ai_engine/
│   │       ├── teaching_engine.py   # GPT-4o lesson generator + demo mode
│   │       ├── prompts.py           # All LLM prompt templates
│   │       ├── views.py             # greeting, teach, interrupt, command
│   │       └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── initial_subjects.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Router + providers
│   │   ├── main.jsx
│   │   ├── index.css                   # Tailwind + accessibility classes
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # Login, register, profile state
│   │   │   ├── LessonContext.jsx       # Lesson blocks, interruptions, commands
│   │   │   └── AccessibilityContext.jsx # CSS class toggles
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx           # 2-step onboarding
│   │   │   ├── DashboardPage.jsx        # Subject grid + history + quick-ask
│   │   │   └── ClassroomPage.jsx        # Full classroom: avatar+whiteboard+mic
│   │   ├── components/
│   │   │   ├── Auth/ProtectedRoute.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── WelcomePanel.jsx     # Greeting + stats
│   │   │   │   ├── SubjectCard.jsx
│   │   │   │   └── LearningHistory.jsx
│   │   │   ├── Avatar/AvatarPlayer.jsx  # CSS avatar + D-ID video
│   │   │   ├── Whiteboard/
│   │   │   │   └── WhiteboardCanvas.jsx # Canvas typewriter + diagrams
│   │   │   ├── Voice/
│   │   │   │   ├── VoiceController.jsx  # Continuous speech recognition
│   │   │   │   ├── MicrophoneButton.jsx # Visual mic toggle
│   │   │   │   └── TranscriptDisplay.jsx
│   │   │   └── Accessibility/
│   │   │       └── AccessibilityPanel.jsx
│   │   └── services/
│   │       ├── api.js             # Axios client + interceptors
│   │       ├── speechService.js   # Web Speech Synthesis wrapper
│   │       └── avatarService.js   # D-ID API client
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── .env.example
│
└── docker-compose.yml
```

---

## 🚀 Local Deployment Instructions

### Prerequisites
- **Node.js 20+**
- **Python 3.11+**
- **PostgreSQL 14+** (or use Docker / Neon cloud)
- **Redis** (or use Docker)

---

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone / open the project
cd echotutor

# 2. Copy and configure environment files
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# 3. (Optional) Add your OpenAI key to backend\.env
#    OPENAI_API_KEY=sk-...
#    Without it, the demo mode will be used automatically.

# 4. Start everything
docker compose up --build

# Access:
#   Frontend  → http://localhost:5173
#   Backend   → http://localhost:8000
#   Admin     → http://localhost:8000/admin
```

---

### Option B — Manual Setup

#### Backend

```bash
cd echotutor\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your DB credentials and API keys

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Load initial subjects
python manage.py loaddata initial_subjects.json

# Start the server
python manage.py runserver
# Backend running at http://localhost:8000
```

#### Frontend

```bash
cd echotutor\frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit VITE_API_URL if backend is on a different port

# Start dev server
npm run dev
# Frontend running at http://localhost:5173
```

---

## 🔑 API Keys (Optional — Demo Works Without Them)

| Service | Purpose | Where to get |
|---|---|---|
| `OPENAI_API_KEY` | GPT-4o lesson generation | [platform.openai.com](https://platform.openai.com) |
| `VITE_DID_API_KEY` | Realistic talking avatar video | [docs.d-id.com](https://docs.d-id.com) |
| `ELEVENLABS_API_KEY` | Premium TTS voice (optional) | [elevenlabs.io](https://elevenlabs.io) |

**Without any API keys:** EchoTutor runs in full **demo mode** with pre-built lesson content, a CSS-animated avatar, and browser-native TTS. Perfect for hackathon demos!

---

## 🎭 Demo Scenario Walkthrough

1. **Visit** `http://localhost:5173` → redirected to login
2. **Sign up** with any name/email/password
3. **Dashboard** loads — Echo greets you by name (spoken aloud)
4. **Type a topic** — "Explain quadratic equations" — click **Start Lesson ✨**
5. **Classroom opens:**
   - Avatar Echo appears on the left and begins speaking
   - Whiteboard animates equations on the right
   - Mic button listens continuously
6. **Interrupt anytime:** Say "give me an example" or "can you repeat that?"
   - Echo pauses, answers your question, then resumes
7. **Voice commands:** "slower", "faster", "summarize", "why", "show steps"
8. **Accessibility:** Toggle high contrast / dyslexia font / large text from dashboard
9. **Exit** → lesson saved to history, visible on dashboard

---

## 🧑‍🏫 AI Teaching Format

Echo outputs structured blocks that the frontend executes:

```
SPEECH: Great question! Let me show you how quadratic equations work.
WRITE: ax² + bx + c = 0
SPEECH: This is the standard form. a, b, and c are known numbers.
WRITE: x = (−b ± √(b²− 4ac)) / 2a
DRAW: parabola opening upward with vertex at minimum
PAUSE: Does that make sense so far?
```

---

## ♿ Accessibility Features

| Setting | What it does |
|---|---|
| **High Contrast** | Dark background + bright text, raised contrast filter |
| **Large Text** | 25% larger text throughout the UI |
| **Dyslexia Font** | Switches entire UI to OpenDyslexic typeface with extra spacing |
| **Reduce Motion** | Disables all CSS animations and transitions |
| **Voice-Only Mode** | Marks UI for voice navigation (future: full keyboard/voice nav) |

All settings are saved to localStorage and synced to the user's profile in the database.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Get JWT tokens |
| POST | `/api/auth/logout/` | Invalidate refresh token |
| GET/PATCH | `/api/auth/profile/` | View or update profile |
| PATCH | `/api/auth/accessibility/` | Update accessibility flags |

### AI Engine
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/greeting/` | Personalised spoken greeting |
| POST | `/api/ai/teach/` | Generate lesson blocks for a topic |
| POST | `/api/ai/interrupt/` | Respond to a student question |
| POST | `/api/ai/command/` | Handle named commands (repeat, slower…) |

### Lessons
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/lessons/sessions/` | Start a lesson session |
| GET | `/api/lessons/history/` | Lesson history |
| POST | `/api/lessons/sessions/{id}/end/` | End a session |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Django 4.2, Django REST Framework, Django Channels |
| Auth | JWT (SimpleJWT), custom User model |
| Database | PostgreSQL (Neon cloud compatible) |
| AI | OpenAI GPT-4o |
| Avatar | D-ID Talking Avatar API / CSS fallback |
| TTS | Web Speech Synthesis API / ElevenLabs |
| STT | Web Speech Recognition API |
| Cache/WS | Redis + Django Channels |

---

## 🏆 MVP Priority Checklist

- [x] Authentication (register, login, JWT)
- [x] Personalised greeting spoken by avatar
- [x] Avatar speaking during lessons
- [x] Whiteboard step-by-step explanation
- [x] Voice conversation (always listening)
- [x] Live interruption handling
- [x] Accessibility toggles (contrast, font, size, motion)
