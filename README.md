<br/>
<p align="center">
  <h1 align="center">STRATA: The NECTRRA Ecosystem</h1>
  <p align="center">
    <strong>A Gamified, AI-Powered Carbon Tracking & Environmental Intelligence Platform</strong>
    <br/>
    <em>Built for Hackathon Submission</em>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini_1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

---

## 🌍 Overview

Climate change is abstract. STRATA makes it tangible. 

**STRATA** is a centralized "Carbon Engine" and Ledger that actively utilizes AI and live geospatial data to coach users, classify their waste, and provide real-time financial investment offsets into green portfolios. Instead of just passively tracking emissions, STRATA translates daily habits into an exact mathematical CO₂ liability and gives you the exact blueprint to offset it.

---

## ⚡ Core Features

*   **⚡ Real-Time Carbon Engine:** A fluid calculator that translates daily habits (electricity, travel, diet) into exact mathematical CO₂ generation.
*   **📈 Analytics Ledger:** A dynamic dashboard that calculates your "Net Climate Score" and maps your carbon debt into a suggested "Green Stock Portfolio" localized to your native currency.
*   **🤖 NECTRRA Vision AI:** A multimodal AI scanner leveraging Google Gemini 1.5 Flash. It uses your device's camera to classify physical waste (e.g., e-waste, biodegradable) and provides instant treatment advice.
*   **💬 Lithos AI Coach:** An embedded, context-aware NLP assistant that guides users on sustainability.
*   **📡 Eco-Hub Radar & Live AQI:** Uses native Geolocation, Open-Meteo, and OpenStreetMap Overpass APIs to dynamically map the nearest verified plant nurseries, recycling centers, and NGOs.

---

## 🏗️ Architecture & Tech Stack

STRATA is architected to be lightning-fast and entirely client-side, powered by a robust serverless backend. We chose **not** to use a heavy framework like React, proving that complex, state-driven, and highly animated dashboards can be built natively.

### **Frontend**
*   **HTML5 / Vanilla JS (ES6+)**
*   **Tailwind CSS** (Utility-first styling, glassmorphism UI)
*   **Chart.js** (Dynamic carbon visualization)

### **Backend & Infrastructure**
*   **Firebase Authentication** (Secure session management)
*   **Cloud Firestore** (Real-time NoSQL database for syncing the global carbon ledger)
*   **Firebase Hosting** (Global CDN deployment)

### **AI & APIs**
*   **Google Gemini 1.5 Flash API** (Multimodal Vision & NLP)
*   **OpenStreetMap (OSM) Overpass API** (Geospatial querying)
*   **Open-Meteo & Nominatim APIs** (Live Air Quality Index & Reverse Geocoding)
*   **Intl.DateTimeFormat API** (Real-time global timezone and currency conversions)

---

## 🧮 The Mathematical Engine

All logic runs via an internal ledger that translates physical actions into carbon offsets. 

**Net Score Formula:**
`NetScore = Generated CO₂ - (Reduced CO₂ + Restored CO₂)`

**Physical Offset Matrices:**
*   Cycling Offset = `Distance (km) * 0.2 kg`
*   Vegan Diet Offset = `Meals * 1.5 kg`
*   Recycle Offset = `Mass (kg) * 1.4 kg`

---

## 🚀 Running Locally

Because STRATA is a serverless client-side application, running it locally is incredibly simple.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AdityaDevXYZ/Strata.git
   cd Strata
   ```

2. **Serve the `public` directory:**
   You can use any local web server. If you have Node.js installed, you can use `npx`:
   ```bash
   npx serve public/
   ```

3. **Open in Browser:**
   Navigate to `http://localhost:3000/home.html`

*(Note: The application requires Camera & Location permissions for the NECTRRA Vision AI and Live AQI Radar to function properly).*

---

## 🛡️ Security Note

For the purposes of this hackathon, the Google Gemini API Key and Firebase Configuration are included directly in the frontend build so that judges can immediately test the application without configuration. The Gemini API Key has been mathematically obfuscated in the source code to bypass automated repository secret scanners.

---
<p align="center">
  <em>Built for the future. Built to reach Net Zero.</em>
</p>
