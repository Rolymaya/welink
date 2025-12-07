# SaaS AI Agent Platform

A complete SaaS platform for AI Agents on WhatsApp, built with Nest.js, Next.js, and Weaviate.

## 🚀 Tech Stack

- **Backend**: Nest.js 11, TypeScript, Prisma (PostgreSQL), BullMQ (Redis), Socket.IO
- **Frontend**: Next.js 15, React 19, Tailwind CSS, Shadcn UI
- **AI**: LangChain, Weaviate (Vector DB), Gemini/OpenAI APIs
- **WhatsApp**: Baileys (WebSocket-based)

## 🛠️ Prerequisites

- Docker & Docker Compose
- Node.js 20+
- npm or pnpm

## 📦 Installation

1.  **Clone the repository**
2.  **Start Infrastructure** (Postgres, Redis, Weaviate)
    ```bash
    docker-compose up -d
    ```
3.  **Backend Setup**
    ```bash
    cd backend
    npm install
    npx prisma generate
    npx prisma db push
    npm run start:dev
    ```
    Backend runs on `http://localhost:3001`
    Swagger Docs: `http://localhost:3001/api/docs`

4.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    Frontend runs on `http://localhost:3000`

## 🔑 Default Credentials

- **Super Admin**: Create the first user via API or Register page (role defaults to ADMIN, update manually in DB to SUPER_ADMIN for full access).

## 🤖 Features

- **Super Admin Panel**: Manage Global LLM Keys (OpenAI, Gemini).
- **Multi-tenant**: Create Organizations and invite users.
- **AI Agents**: Create agents with custom prompts and Knowledge Base.
- **WhatsApp**: Scan QR code to connect.
- **Real-time Chat**: Monitor conversations live.

## 📝 License

MIT
