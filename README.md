# 🤖 ChatGPT-Style AI Chatbot Web Application

A modern, full-featured AI chatbot web application inspired by ChatGPT, powered by the official **Google Gemini API** (`@google/generative-ai`), built with **React**, **Tailwind CSS**, and **Node.js / Express**.

![ChatGPT Interface](https://img.shields.io/badge/UI-ChatGPT%20Modern-10a37f?style=for-the-badge)
![AI Model](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind%20CSS-06B6D4?style=for-the-badge)

---

## ✨ Features

### 🎨 Modern UI & Experience
- **ChatGPT-Inspired Design**: Pixel-perfect layout with sleek typography, subtle shadows, and responsive chat bubbles.
- **Dark & Light Mode Toggle**: Smooth theme transition with automatic persistence in `localStorage`.
- **Responsive Layout**: Seamless on mobile, tablet, and desktop with a slide-out drawer sidebar on smaller screens.
- **Micro-Animations**: Smooth message entrance animations, typing dots, and interactive hover states.

### 💬 Real-Time Chat & Intelligence
- **Real AI Integration**: Powered by Google Gemini (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`).
- **Server-Sent Events (SSE) Streaming**: Responses stream in real-time token-by-token just like ChatGPT.
- **Stop Generation**: Cancel an in-progress response at any time.
- **Rich Markdown Support**: Full support for headers, lists, blockquotes, tables, links, and bold/italic styling.
- **Syntax-Highlighted Code Blocks**: Syntax highlighting with language labels and a one-click **Copy Code** button.
- **Message Actions**: Copy full message text, regenerate response, and timestamp displays.
- **Suggested Starters**: Clickable prompt cards on the empty state (Coding, Explaining, Brainstorming, Writing).
- **Auto-Scroll & Scroll-to-Bottom**: Automatically follows new content, with a quick floating scroll-to-bottom button when scrolled up.

### 🗂️ Session & History Management
- **Chat History Grouping**: Categorized by *Today*, *Yesterday*, *Previous 7 Days*, and *Older*.
- **Local Persistence**: Conversations and messages are saved in browser `localStorage`.
- **Conversation Management**: Rename chats inline, delete individual conversations, or clear all chats.
- **Auto-Naming**: Automatically titles conversations based on the initial prompt.
- **Quick Keyboard Shortcuts**: Press `Enter` to send, `Shift + Enter` for new lines, and `Ctrl + K` (or `Cmd + K`) for a new chat.

### 🔒 Enterprise-Grade Security
- **API Keys Kept on Backend**: Frontend never touches raw API secrets unless user specifies a personal test key.
- **Environment Variable Protection**: Stored in `.env` and excluded from version control.
- **Graceful Error Handling**: Clear, user-friendly error banners with actionable resolution steps (missing key, quota exceeded, invalid credentials).

---

## 🏗️ Architecture

```
chatboat/
├── client/                     # Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # ChatMessage, ChatInput, Sidebar, EmptyState, ApiKeyModal, etc.
│   │   ├── hooks/              # useChat (state & SSE streaming), useTheme
│   │   ├── utils/              # storage.js (localStorage manager)
│   │   ├── App.jsx             # Main layout & coordinator
│   │   ├── main.jsx            # React root
│   │   └── index.css           # Tailwind + Markdown & code highlighting styles
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js          # Configured with proxy to backend
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + Google Gen AI SDK)
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.js         # POST /api/chat (SSE streaming), GET /api/models, GET /api/health
│   │   ├── gemini.js           # Gemini SDK client, chat history formatter, error parser
│   │   └── index.js            # Express server initialization, CORS, middleware
│   ├── .env                    # Active environment variables (git-ignored)
│   ├── .env.example            # Example configuration template
│   └── package.json
│
├── .env.example                # Root environment template
├── package.json                # Root package with concurrently dev scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9+ or later

---

### Step 1: Clone or Navigate to the Project

```bash
cd chatboat
```

---

### Step 2: Configure Your Gemini API Key

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open `server/.env` (or copy `server/.env.example` to `server/.env`).
3. Set your API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=5000
DEFAULT_MODEL=gemini-1.5-flash
```

*(Note: You can also configure or change the API key anytime directly in the web app UI using the **Gemini API Key** button in the sidebar or top bar).*

---

### Step 3: Install Dependencies

To install all dependencies for both backend and frontend at once:

```bash
npm run install:all
```

Or install individually:

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

---

### Step 4: Run the Application

#### Option A: Run Both Together (Recommended)
From the root directory:

```bash
npm run dev
```

This starts both:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:3000`

#### Option B: Run Individually

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & verifies if Gemini API key is configured |
| `GET` | `/api/models` | Returns available models (`gemini-1.5-flash`, `gemini-1.5-pro`, etc.) |
| `POST` | `/api/chat` | Chat completion endpoint. Supports Server-Sent Events (`stream: true`) |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Send message |
| `Shift + Enter` | Insert new line |
| `Ctrl + K` / `Cmd + K` | Start new chat |

---

## 🛡️ License

MIT License. Free to use, modify, and distribute.
