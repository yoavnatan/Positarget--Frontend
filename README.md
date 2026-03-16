Positarget – Prediction Market Platform
Positarget is a high-performance prediction market application inspired by Polymarket. It enables users to explore, analyze, and track real-time market data across various categories like Crypto, Politics, and Sports, utilizing the Polymarket Gamma API.

🚀 Live Demo
View Live Project on GitHub Pages

🧠 Project Vision
Developed as a final project for Coding Academy, Positarget bridges the gap between complex financial data and intuitive user experience. Leveraging my background in Finance (MBA) and Banking, the app focuses on data accuracy and clear visualization of market trends.

🏗️ Tech Stack
Frontend: React, TypeScript, Redux Toolkit (RTK)

Styling: SCSS (Sass), CSS Modules, Responsive Design

Data: Polymarket Gamma API integration

State Management: Complex state handling for real-time market filtering and search

Infrastructure: Custom Node.js Proxy (to handle CORS challenges)

🎨 Key Features
Real-time Market Discovery: Browse and search active prediction markets via live API data.

Dynamic Visualization: Interactive price charts and market trend analysis.

Advanced Filtering: Segment markets by category, volume, and status (Active/Closed).

Infinite Scroll: Seamless UX for browsing large datasets.

Security: Integrated JWT Authentication for user-specific features (In Progress).

📂 Project Structure
src/
├── assets/
│   └── styles/        # SCSS architecture (Basics, Mixins, Pages)
├── cmps/              # Reusable UI components (EventList, EventFilter, Chart)
├── pages/             # Route components (EventIndex, EventDetails)
├── services/          # Business logic (event.service, user.service)
├── store/             # Redux Toolkit slices and store configuration
└── types/             # TypeScript interfaces and types
🛠️ Installation & Setup
Clone the repository:

Bash
git clone https://github.com/yoavnatan/Positarget--Frontend.git
Install dependencies:

Bash
npm install
Run development server:

Bash
npm run dev
🚦 Features in Development
[ ] User Profile & Favorite Markets (Persistence)

[ ] Enhanced Chart Interactions (Tooltips & Historical Views)

[ ] Server-side Proxy Optimization for higher rate limits