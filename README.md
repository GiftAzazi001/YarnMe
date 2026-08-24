# YarnMe 🇳🇬

> Cultural-contextual explanation assistant that translates and breaks down complex Nigerian notices, official memos, admission requirements, and circulars into **Simple English**, **Nigerian Pidgin**, and **Hausa**.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/GiftAzazi001/YarnMe.git
cd YarnMe

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

### 3. Configure Gemini API Key
In your `.env` file (or your hosting platform's Environment Variables settings), set:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
```

> **Note:** You can get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build and Run in Production
```bash
# Build frontend assets
npm run build

# Start production full-stack server
npm start
```

---

## 🌐 Deploying to Hosting Platforms

When deploying YarnMe to **Render**, **Railway**, **Vercel**, or **Google Cloud Run**:

1. Add an Environment Variable in your hosting dashboard:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API Key from Google AI Studio
2. Set the build and start commands:
   - **Build Command:** `npm run build`
   - **Start Command:** `node server.ts` or `npm start`
3. Node version: `18+` or `20+`

---

## ✨ Features
- **3 Target Languages:** Simple English, Nigerian Pidgin, and Hausa.
- **Accurate Grounding:** Strictly grounded extraction of deadlines, required documents, fees/payments, eligibility, and action steps.
- **Ambiguity & Cut-Off Warnings:** Transparent confidence notes when circulars or scanned notices have truncated text.
- **Full-Stack Architecture:** Express backend with server-side `@google/genai` calls and responsive React frontend.
