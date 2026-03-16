<img width="1432" height="1001" alt="image" src="https://github.com/user-attachments/assets/a7b7213e-46c1-4748-8c88-e4ceef372224" />
<img width="1337" height="992" alt="image" src="https://github.com/user-attachments/assets/426832e6-b836-4cef-b7cb-f9898ecdfb44" />
<img width="2564" height="2012" alt="image" src="https://github.com/user-attachments/assets/e36e24f2-abd6-4110-bacb-6e52f8a707be" />


Positarget – Prediction Market Platform
Positarget is a high-performance prediction market application inspired by Polymarket. It enables users to explore, analyze, and track real-time market data across various categories like Crypto, Politics, and Sports, utilizing the Polymarket Gamma API.

🚀 Live Demo
View Live Project on GitHub Pages
https://yoavnatan.github.io/Positarget--Frontend/

🧠 Project Vision
Developed as an Independent project, Positarget bridges the gap between complex financial data and intuitive user experience. Leveraging my background in Finance (MBA) and Banking, the app focuses on data accuracy and clear visualization of market trends, with a high performative UX.

🏗️ Tech Stack

Frontend: React, TypeScript, Redux Toolkit (RTK)

Styling: SCSS (Sass), CSS Modules, Responsive Design

Data: Polymarket Gamma API integration

State Management: Complex state handling for real-time market filtering and search

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

git clone https://github.com/yoavnatan/Positarget--Frontend.git
Install dependencies:

npm install
Run development server:

npm run dev:local

🚦 Features in Development

[ ] User Profile & Favorite Markets (Persistence)

[ ] Enhanced Chart Interactions (Tooltips & Historical Views)

[ ] Server-side Proxy Optimization for higher rate limits
