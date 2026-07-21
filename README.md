# OTT Education Platform - Graduation Project

Welcome to the **OTT Education Platform**, a modern, microservices-based online education and collaboration system. The platform integrates a Next.js web application, a React Native mobile client, multiple specialized backend microservices, real-time messaging, WebRTC video calling, and AI-driven automated quiz generation.

---

## 🚀 Key Features & Architectural Overview

The system is designed following a **Microservices Architecture** to ensure scalability, fault tolerance, and clear domain separation:

- 💻 **Web Application (`apps/web-app`)**: Modern Next.js 16 (App Router, Turbopack) student/instructor portal featuring glassmorphic UI, unified "Deep Blue" design system (`#4b53bc`, `#d1d2eb`), and responsive layouts.
- 📱 **Mobile Application (`apps/mobile-app`)**: Cross-platform mobile app built with React Native (Expo) for on-the-go learning and chat.
- 🧠 **Core Service (`services/core-service`)**: Spring Boot (Java 21) handling user authentication, profile management, team/class management, permissions, and database migrations via Flyway.
- 💬 **Chat & Call Service (`services/chat-service`)**: Node.js microservice delivering real-time messaging (Socket.io) and multi-party audio/video conferencing (Mediasoup WebRTC SFU).
- 📝 **Assignment Service (`services/assignment-service`)**: Spring Boot (Java 21) microservice powering online quizzes, assignment distribution, student submissions, and automated grading.
- 🤖 **AI Service (`services/ai-service`)**: Spring Boot (Java 21) service backed by PostgreSQL for processing document materials and automatically generating quiz questions.
- 🌐 **Unified API Gateway (`gateway`)**: Nginx reverse proxy with SSL (`https://localhost:8000`), JWT access token validation via `auth_request`, and LAN support for WebRTC media permissions.

---

## 🏗 Microservices & Database Architecture

```
                                  +-----------------------+
                                  |     Clients & Apps    |
                                  | Web (Next.js) / Mobile|
                                  +-----------+-----------+
                                              |
                                              v (HTTPS 8000 / WSS)
                                  +-----------+-----------+
                                  |  Nginx API Gateway    |
                                  +-----+-----+-----+-----+
                                        |     |     |
            +---------------------------+     |     +---------------------------+
            |                                 |                                 |
            v                                 v                                 v
  +---------+---------+             +---------+---------+             +---------+---------+
  |   Core Service    |             |   Chat Service    |             | Assignment Svc  |
  |  (Spring Boot)    |             | (Node.js/Socket)  |             |  (Spring Boot)  |
  +---------+---------+             +---------+---------+             +---------+---------+
            |                                 |                                 |
            v                                 v                                 v
     MySQL (Core DB)                 MongoDB (Chat DB)               MySQL (Assign DB)
     
                                              |
                                              v
                                    +---------+---------+
                                    |    AI Service     |
                                    |  (Spring Boot)    |
                                    +---------+---------+
                                              |
                                              v
                                      PostgreSQL (AI DB)
```

---

## 📂 Monorepo Structure

```bash
├── apps/
│   ├── web-app/               # Next.js 16 Web Portal (App Router, Tailwind CSS)
│   └── mobile-app/            # React Native (Expo) Mobile App
├── services/
│   ├── core-service/          # Spring Boot Backend (Auth, Users, Teams, Flyway)
│   ├── chat-service/          # Node.js Chat Backend (Socket.io, Mediasoup SFU)
│   ├── assignment-service/    # Spring Boot Assignment & Quiz Service
│   └── ai-service/            # Spring Boot AI Service (Quiz Generation & Documents)
├── gateway/                   # Nginx Reverse Proxy Configuration & SSL Certificates
├── docker-compose.yml         # Main Docker Orchestration file
├── docker-compose.prod.yml    # Production Docker Orchestration file
├── docker-compose.local-ai.yml# Local AI Stack Docker file
├── .env.example               # Environment variables template
└── README.md                  # Project Documentation
```

---

## 🛠 Tech Stack & Prerequisites

### Technologies Used

| Layer / Subsystem | Primary Technologies |
| :--- | :--- |
| **Frontend Web** | Next.js 16 (Turbopack), React 19, Tailwind CSS, Lucide Icons |
| **Mobile App** | React Native, Expo |
| **Backend Services** | Java 21 (Spring Boot 3), Node.js (TypeScript, Socket.io, Mediasoup) |
| **Databases** | MySQL 8.0, MongoDB 6.0, PostgreSQL 16 |
| **API Gateway** | Nginx with SSL & JWT Auth Validation |
| **Containerization** | Docker, Docker Compose |

### Prerequisites

- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v20+ LTS)
- [Java JDK 21+](https://adoptium.net/)

---

## ⚙️ Installation & Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ott-edu
```

### 2. Configure Environment Variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

### 3. Run Application Stack with Docker Compose

Start all microservices, databases, and the API gateway:

```bash
docker compose up -d --build
```

To view real-time logs of a specific service:

```bash
docker compose logs -f web-app
# or: docker compose logs -f core-service
```

To stop all services:

```bash
docker compose down
```

### 4. Run Mobile App (Local Development)

The mobile client runs outside Docker for Expo Go emulator testing:

```bash
cd apps/mobile-app
npm install
npm start
```

---

## 🌐 Endpoints & Port Mappings

| Component | Protocol / Port | Target Container / Description |
| :--- | :--- | :--- |
| **API Gateway (Primary)** | `https://localhost:8000` | Unified SSL entrypoint for Web App & APIs |
| **Gateway HTTP Fallback** | `http://localhost:8088` | Redirects to HTTPS 8000 |
| **Web Portal** | `https://localhost:8000/` | Proxied to `web-app:3000` |
| **Core Service API** | `https://localhost:8000/api/core/` | Spring Boot Core Service |
| **Chat Service API** | `https://localhost:8000/api/chat/` | Node.js Chat Service |
| **Socket.io Realtime Chat**| `wss://localhost:8000/socket.io/` | Realtime messaging & call signaling |
| **Mediasoup WebRTC SFU** | Ports `40000-40050` (UDP/TCP)| Audio/Video calling streams |
| **MySQL Database (Core/Assign)**| `localhost:3306` | MySQL 8.0 (`ott_education_db` & `ott_assignment_db`) |
| **MongoDB Database (Chat)**| `localhost:27017` | MongoDB 6.0 (`chat_history_db`) |
| **PostgreSQL Database (AI)**| `localhost:5434` | PostgreSQL 16 (`ai_service_db`) |

---

## 🔐 Gateway JWT Authentication

The API Gateway enforces secure JWT access-token verification via Nginx `auth_request` before proxying requests to internal backend microservices.

- **Protected API Routes**:
  - `/api/core/**`
  - `/api/chat/**`
- **Public API Routes (No JWT required)**:
  - `/api/core/auth/**` (Login, Register, OTP, Password Reset)
  - `/api/core/schools/**`

### Authentication Flow:
1. Client sends request with `Authorization: Bearer <access_token>`.
2. Nginx Gateway sends subrequest to `GET /auth/validate` on Core Service.
3. If token is valid (`200 OK`), request proceeds to the target service.
4. If token is invalid or expired, Gateway returns `401 Unauthorized`.

---

## 🗄️ Database Credentials (Local Defaults)

- **MySQL**:
  - Host: `localhost` | Port: `3306`
  - User: `root` | Password: `root_password` (or `admin` / `admin_password`)
  - Databases: `ott_education_db`, `ott_assignment_db`
- **MongoDB**:
  - Host: `localhost` | Port: `27017`
  - User: `root` | Password: `secret_mongo_pass`
  - Database: `chat_history_db`
- **PostgreSQL**:
  - Host: `localhost` | Port: `5434`
  - User: `ai_service` | Password: `ai_service`
  - Database: `ai_service_db`

---

## 🤝 Team Workflow & Branching Strategy

We follow the **Feature Branch Workflow** (Git Flow). Direct commits to `main` are strictly prohibited.

- **`main`**: Production-ready code. Merged via Pull Requests with mandatory review.
- **`develop`**: Integration and staging branch.
- **Feature Branches**: `feat/*`, `fix/*`, `refactor/*`, `style/*`, `docs/*`.

### Commit Convention
```
<type>: <short summary>

Example:
feat: unify default user avatar fallbacks across chat sidebar and message bubbles
fix: resolve type error in VerifyRegisterPage authentication payload
```
