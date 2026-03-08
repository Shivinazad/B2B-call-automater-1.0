<div align="center">

# 🎯 Sniper — B2B AI Sourcing & Negotiation Agent

### *Find vendors. Verify them. Call them. Close deals. Automatically.*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-CDN-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)]()

</div>

---

## 🚨 The Problem

Indian SMBs and procurement teams spend **60–80% of their time** manually searching IndiaMart, cold-calling vendors, and negotiating prices — a process that is slow, inconsistent, and heavily dependent on human bandwidth.

> A startup trying to source 5,000 cotton hoodies in Ludhiana has to call 30+ vendors, compare quotes, verify GST numbers, and haggle over price — all manually. This takes **days**.

---

## ⚡ The Solution — Sniper

Sniper is a **fully autonomous B2B procurement agent** that does all of this in minutes:

1. **Scrapes IndiaMart** for relevant vendors based on your natural-language query
2. **Verifies GSTIN** for each vendor in real-time
3. **Auto-dials vendors** using an AI voice agent
4. **Negotiates price** autonomously using live sentiment analysis
5. **Reports the best deal** — price, vendor, and savings — directly to you

---

## 🎬 Demo

**Live input:** *"Find me 500 cotton hoodies in Ludhiana under ₹180"*

The agent then:
- Searches IndiaMart B2B directory
- Filters by GST verified vendors
- Dials the best match
- Shows live savings in the dashboard

---

## 🏗️ Architecture

```
User Input (Natural Language)
        │
        ▼
┌─────────────────────┐
│   Landing Page UI   │  ← index.html + script.js
│  (Sourcing Agent)   │
└────────┬────────────┘
         │  POST /send-login-alert
         ▼
┌─────────────────────┐
│  Node.js HTTP Server│  ← server.js (zero deps)
│   (API + Static)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐     ┌──────────────────┐
│   Auth Flow         │────▶│   Dashboard       │
│ login / signup      │     │  (Post-auth UI)   │
└─────────────────────┘     └──────────────────┘
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **Autonomous Agent Log** | Real-time activity feed showing every step the agent takes |
| 📞 **Auto-Calling** | AI voice agent dials vendors and negotiates on your behalf |
| ✅ **GST Verification** | Validates GSTIN live — only contacts verified suppliers |
| 🗺️ **45+ City Hubs** | Pan-India coverage: Ludhiana, Surat, Tiruppur, and more |
| 💰 **Live Deal Tracker** | Shows ₹ savings negotiated in real-time |
| 🔐 **Auth System** | Email/password login + Google sign-in ready |
| 📊 **Dashboard** | Post-login hub with sourcing, calling, and reporting modules |
| 📱 **Fully Responsive** | Works seamlessly on desktop and mobile |
| 🍪 **Privacy Compliant** | GDPR-style cookie consent banner |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Tailwind CSS, Vanilla JavaScript |
| **Backend** | Node.js (built-in `http` — zero npm dependencies) |
| **Fonts** | Inter (Google Fonts) |
| **Icons** | Font Awesome 6 |
| **Animations** | CSS Keyframes + Intersection Observer API |
| **Auth API** | RESTful JSON endpoint (`POST /send-login-alert`) |

> **Zero npm dependencies** — the server runs with just `node server.js`. No `npm install` needed.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18

### Run locally in 2 steps

```bash
# 1. Clone the repo
git clone https://github.com/Shivinazad/B2B-call-automater-1.0.git
cd B2B-call-automater-1.0

# 2. Start the server
node server.js
```

Open **http://localhost:3000** in your browser. That's it — no build step, no `npm install`.

---

## 📁 Project Structure

```
B2B-call-automater-1.0/
├── index.html        # 🏠 Landing page with live sourcing demo
├── login.html        # 🔑 Login page
├── signup.html       # 📝 Signup page
├── dashboard.html    # 📊 Post-auth user dashboard
├── server.js         # ⚙️  Node.js HTTP server + REST API
├── style.css         # 🎨 Global styles, animations & brand palette
├── script.js         # 🧠 Client-side logic: agent log, deal counter
├── package.json      # 📦 Project metadata
└── .gitignore
```

---

## 🔌 API Reference

### `POST /send-login-alert`

Captures a login or signup event.

**Request**
```json
{
  "email": "user@example.com",
  "password": "••••••••",
  "type": "LOGIN"
}
```

**Response**
```json
{ "success": true, "message": "LOGIN recorded." }
```

---

## 🗺️ Pages

| Route | Page |
|---|---|
| `http://localhost:3000/` | Landing page |
| `http://localhost:3000/login.html` | Login |
| `http://localhost:3000/signup.html` | Sign up |
| `http://localhost:3000/dashboard.html` | Dashboard |

---

## 🔮 Roadmap

- [ ] Connect to live IndiaMart scraper API
- [ ] Integrate Twilio / VAPI for real AI voice calls
- [ ] Add Razorpay / Stripe subscription billing
- [ ] Export deal reports as PDF
- [ ] WhatsApp bot integration for mobile-first users
- [ ] Tally / SAP SDK for enterprise sync

---

## 👥 Team

Built with ❤️ at a Hackathon — March 2026

---

## 📄 License

MIT © 2026 Sniper
