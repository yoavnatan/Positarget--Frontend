<div align="center">

# Positarget

### Real-Time Prediction Market Platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://yoavnatan.github.io/Positarget--Frontend/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio)](https://socket.io/)

A high-performance prediction market application inspired by Polymarket. Explore, analyze, and track real-time market data across categories like Crypto, Politics, and Sports — powered by the Polymarket Gamma API, WebSockets, and a full-stack architecture.

</div>

---

<img width="1432" height="1001" alt="image" src="https://github.com/user-attachments/assets/a7b7213e-46c1-4748-8c88-e4ceef372224" />
<img width="1337" height="992" alt="image" src="https://github.com/user-attachments/assets/426832e6-b836-4cef-b7cb-f9898ecdfb44" />
<img width="2564" height="2012" alt="image" src="https://github.com/user-attachments/assets/e36e24f2-abd6-4110-bacb-6e52f8a707be" />

---

## 🚀 Live Demo

**[View Live Project →](https://yoavnatan.github.io/Positarget--Frontend/)**

---

## 🧠 Project Vision

Positarget bridges the gap between complex financial data and intuitive user experience. Developed as an independent full-stack project, it leverages a background in **Finance (MBA) and Banking** to deliver data accuracy, clear visualization of market trends, and a high-performance UX — all backed by real-time data streaming.

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI architecture |
| **TypeScript** | Type-safe development across the codebase |
| **Redux Toolkit (RTK)** | Centralized state management with slices |
| **SCSS / CSS Modules** | Modular, maintainable styling with responsive design |
| **Socket.io Client** | Real-time market data streaming to the UI |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js / Express** | RESTful API server and middleware layer |
| **MongoDB / Mongoose** | Persistent data storage for users, markets, and sessions |
| **Socket.io** | WebSocket server for bi-directional real-time updates |
| **JWT Authentication** | Secure token-based user authentication |

### External APIs
| Source | Usage |
|---|---|
| **Polymarket Gamma API** | Live prediction market data, pricing, and event metadata |

---

## 🎨 Key Features

- **Real-Time Market Discovery** — Browse and search active prediction markets with live data streamed via WebSockets.
- **Dynamic Visualization** — Interactive price charts and market trend analysis with historical data views.
- **Advanced Filtering & Search** — Segment markets by category, volume, liquidity, and status (Active / Closed).
- **Infinite Scroll** — Seamless browsing experience for large datasets with optimized rendering.
- **Real-Time Updates** — Socket.io integration pushes live price changes and market events to connected clients instantly.
- **User Authentication** — JWT-based auth flow with secure login, registration, and session management.
- **Persistent Data Layer** — MongoDB stores user preferences, favorite markets, and application state.

---

## 📂 Project Structure

```
Positarget--Frontend/
├── src/
│   ├── assets/
│   │   └── styles/            # SCSS architecture (variables, mixins, pages)
│   ├── cmps/                  # Reusable UI components (EventList, EventFilter, Chart)
│   ├── pages/                 # Route-level components (EventIndex, EventDetails)
│   ├── services/              # Business logic & API clients (event.service, user.service, socket.service)
│   ├── store/                 # Redux Toolkit slices and store configuration
│   └── types/                 # TypeScript interfaces and type definitions
├── public/
├── package.json
└── vite.config.ts

Positarget--Backend/
├── api/
│   ├── event/                 # Event routes, controller, and service
│   └── user/                  # User routes, controller, and service
├── middlewares/                # Auth middleware, error handling
├── config/                    # DB connection, environment config
├── services/
│   └── socket.service.js      # Socket.io server initialization and event handlers
├── server.js
└── package.json
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Node.js ≥ 18
- MongoDB (local instance or Atlas connection string)

### Frontend

```bash
git clone https://github.com/yoavnatan/Positarget--Frontend.git
cd Positarget--Frontend
npm install
npm run dev:local
```

### Backend

```bash
git clone https://github.com/yoavnatan/Positarget--Backend.git
cd Positarget--Backend
npm install
npm run dev
```

> **Note:** Ensure MongoDB is running and environment variables are configured before starting the backend.

---

## ⚙️ Environment Variables

Create a `.env` file in the backend root:

```env
PORT=3030
MONGO_URI=mongodb://localhost:27017/positarget
JWT_SECRET=your_jwt_secret
```

---

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built by [Yoav Natan](https://github.com/yoavnatan)**

</div>


