# 🌐 AI Call Assistant

> A real-time, full-stack AI voice assistant designed to bridge language barriers during professional phone calls.
<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12%2B-blue" alt="Python">
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688" alt="FastAPI">
  <img src="https://img.shields.io/badge/Deepgram-STT-orange" alt="Deepgram">
  <img src="https://img.shields.io/badge/Gemini-AI_Assistant-brightgreen" alt="Generative AI">
</p>

AI Call Assistant captures live audio, performs ultra-low latency Speech-to-Text (STT) transcription, and leverages Generative AI to provide instant bilingual summaries, translations, and actionable smart replies.

<p align="center">
  <img width="32%" alt="Theme 1" src="https://github.com/user-attachments/assets/8075f1dc-7f90-4a80-a672-20aa48d1560f" />
  <img width="32%" alt="Theme 2" src="https://github.com/user-attachments/assets/f42c8632-86d4-4292-ad5c-fdc2a2868a95" />
  <img width="32%" alt="Theme 3" src="https://github.com/user-attachments/assets/4e6ca6ba-9900-41f6-806e-0b96cf415c78" />
</p>

## ✨ Key Features

* **Ultra-Low Latency Streaming:** Real-time bidirectional audio streaming via WebSockets.
* **Context-Aware AI:** Dynamically adjusts translations and reply suggestions based on the selected scenario (e.g., Software Engineering Interview, Customer Support).
* **Bilingual Smart Replies:** Generates context-perfect responses with native Text-to-Speech (TTS) integration for immediate vocalization.
* **14-Language Support:** Comprehensive bidirectional translation mapping.
* **Multi-Tenant Authentication:** Secure user sign-up and data isolation powered by Clerk.
* **Session Persistence & Export:** Automatically logs call histories to a database with one-click exports to Markdown, PDF, CSV, and JSON.
* **Dynamic Theming:** Seamlessly switch between Light, Dark, and Cyberpunk UI themes.

## 🏗️ System Architecture

This project strictly adheres to a separation of concerns, utilizing a concurrent streaming pipeline:

1. **The Client (Next.js):** Captures microphone audio via the `MediaRecorder` API and streams binary data over WebSockets.
2. **The Proxy Engine (FastAPI):** Receives audio chunks and proxies them to Deepgram's live endpoint for sub-second transcription.
3. **The AI Brain (Google Gemini):** Processes full sentences to generate structured JSON payloads (Summaries, Translations, Replies).
4. **Data Persistence (SQLAlchemy):** Asynchronously commits session metadata to a relational database.
    
The application follows a decoupled architecture, optimizing for both fast static asset delivery and low-latency real-time communication. 

```mermaid
graph TD
    %% Style Definitions
    classDef frontend fill:#e0f2fe,stroke:#2563eb,stroke-width:2px
    classDef backend fill:#fce7f3,stroke:#4f46e5,stroke-width:2px
    classDef external fill:#fef3c7,stroke:#db2777,stroke-width:2px
    classDef db fill:#dcfce3,stroke:#16a34a,stroke-width:2px
    classDef network fill:#f3f4f6,stroke:#475569,stroke-width:2px

    User((🗣️ User))

    subgraph Frontend_Vercel ["Frontend Layer (Hosted on Vercel)"]
        UI[Next.js + React UI]:::frontend
        Mic[MediaRecorder API]:::frontend
        TTS[Web Speech API TTS]:::frontend
    end

    subgraph Network_Layer ["Network & Security Layer"]
        DNS[DNS Route 53 / Domain]:::network
        Caddy[Caddy Reverse Proxy + Auto SSL]:::network
    end

    subgraph Backend_Server ["Compute Layer (Docker on DigitalOcean)"]
        WS[WebSocket /ws/audio]:::backend
        FastAPI[FastAPI Async Server]:::backend
        LLM[LLM Service Logic]:::backend
    end

    subgraph External_AI ["External AI Services (API)"]
        Deepgram["Deepgram STT (Real-time)"]:::external
        Gemini["Gemini 3.1 Flash Lite (LLM)"]:::external
    end

    subgraph Cloud_DB ["Managed Data Layer (Neon)"]
        Postgres[(Neon Serverless PostgreSQL)]:::db
    end

    %% Data Flow
    User -- "Audio Input" --> Mic
    Mic -- "1. Real-time Stream (wss://)" --> DNS
    DNS --> Caddy
    Caddy -- "2. SSL Offloading & Proxy (ws://)" --> WS
    WS --> FastAPI
    
    %% AI Pipeline
    FastAPI -- "3. Stream Audio Data" --> Deepgram
    Deepgram -. "4. Live Transcript" .-> FastAPI
    FastAPI -- "5. Contextual Prompting" --> LLM
    LLM -- "6. Translation & Reasoning" --> Gemini
    Gemini -. "7. Bilingual JSON Response" .-> LLM
    
    %% Database - Key Architectural Highlight
    LLM -- "8. Async Persistence (asyncpg + SSL)" --> Postgres
    
    %% Response Flow
    LLM -- "9. Push Structured Data" --> WS
    WS --> Caddy
    Caddy -- "10. Encrypted JSON Delivery" --> UI
    UI -- "11. Parse English Response" --> TTS
    TTS -- "12. Voice Synthesis" --> User

    %% Footnote
    class Postgres db
```

## 📂 Project Architecture & Directory Structure

The project follows a decoupled client-server architecture.

```text
ai-call-assistant/
├── frontend/                     # Next.js Frontend App
│   ├── app/
│   │   ├── history/
│   │   │   └── page.tsx          # Session history & multi-format export interface
│   │   ├── sign-in/[[...sign-in]]/
│   │   │   └── page.tsx          # Custom Clerk sign-in page (Cyberpunk theme)
│   │   ├── sign-up/[[...sign-up]]/
│   │   │   └── page.tsx          # Custom Clerk sign-up page
│   │   ├── globals.css           # Global styles & CSS variables (Theme configuration)
│   │   ├── layout.tsx            # Root layout, ClerkProvider, Sync theme script
│   │   └── page.tsx              # Main interactive call interface (WebSocket client)
│   ├── components/
│   │   └── Flag.tsx              # Reusable flag icon component (flag-icons CSS)
│   │   └── ThemeToggle.tsx       # Theme switcher button (dark/light/cyber)
│   ├── lib/
│   │   └── useTheme.ts           # Custom React hook for dynamic theme switching
│   │   └── constant.ts           # Shared constants: LANGUAGES, SCENARIOS, formatLocalDate
│   ├── public/
│   │   └── auth-bg.png           # Authentication background asset
│   ├── middleware.ts             # Clerk authentication route protection
│   ├── package.json
│   └── .env.local                # Frontend secrets (API URL, Clerk Keys)
│
├── backend/                      # FastAPI Python Server
│   ├── app/
│   │   ├── services/
│   │   │   └── llm_service.py    # Google GenAI integration (Prompt engineering)
│   │   ├── main.py               # WebSocket endpoint & HTTP API routes
│   │   ├── models.py             # SQLAlchemy ORM models (User-isolated CallRecords)
│   │   ├── database.py           # Database connection & session management
│   │   ├── migrate_db.py         # DB migration script (Schema updates)
│   │   ├── Dockerfile            # Multi-stage optimized Docker build
│   │   ├── docker-compose.yml    # Container orchestration & volume mapping
│   │   ├── requirements.txt      # Python dependencies
│   │   └── .env                  # Backend secrets (API Keys, CORS origins)
│   └── data/                     # Persistent Docker volume mount for database
│
├── .gitignore                    # Global git ignore rules
└── README.md                     # Project documentation
```

## 🛠️ Tech Stack

**Frontend**
* Framework: Next.js 15 (React 19)
* Styling: Tailwind CSS
* Authentication: Clerk
* State Management: React Hooks (`useRef`, `useState`, `useEffect`)

**Backend**
* Framework: FastAPI (Python)
* Async Server: Uvicorn
* Database ORM: SQLAlchemy & aiosqlite (PostgreSQL-ready)
* AI/ML APIs: Deepgram (STT), Google GenAI SDK (Gemini 3.1 Flash Lite)

**DevOps & Deployment**
* Containerization: Docker & Docker Compose
* Reverse Proxy & SSL: Caddy Server
* Hosting: Vercel (Frontend) + DigitalOcean Droplet (Backend)

## 🚀 Getting Started (Local Development)

### Prerequisites
* Node.js (v20+)
* Python 3.12+
* Docker & Docker Compose
* API Keys for [Deepgram](https://deepgram.com/), [Google AI Studio](https://aistudio.google.com/), and [Clerk](https://clerk.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/Ryan-z-Feng-ccsf/ai-call-assistant.git
cd ai-call-assistant
```

### 2. Backend Setup (Dockerized)
Create a .env file in backend/app/:

Code snippet
```bash
DEEPGRAM_API_KEY=your_deepgram_api_key
GEMINI_API_KEY=your_gemini_api_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
ALLOWED_ORIGINS=http://localhost:3000
```

Build and spin up the backend container:

```bash
cd backend/app
docker compose up --build -d
```

The FastAPI server will be running at http://localhost:8000.


### 3. Frontend Setup
Create a .env.local file in frontend/:

Code snippet
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

Install dependencies and run the development server:

```bash
cd frontend
npm install
npm run dev
```
The UI will be accessible at http://localhost:3000.


## 🌍 Production Deployment

This application is designed for cloud-native deployment:

Frontend: Deployed on Vercel with environment variables pointing to the production API.

Backend: Containerized via Docker and deployed on a DigitalOcean Droplet.

Security: Caddy handles automatic SSL termination (wss:// and https://) via Let's Encrypt.

## 📄 License
This project is open-source and available under the MIT License.


