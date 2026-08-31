# 📦 RestockAI — AI-Powered Retail Inventory Intelligence

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://your-deployment-link.vercel.app)
[![API Docs](https://img.shields.io/badge/API_Docs-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://your-api-link.onrender.com/docs)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**RestockAI** is an end-to-end, intelligent inventory management and demand forecasting platform. It combines machine learning time-series models (**Facebook Prophet** & **XGBoost**), **Anthropic Claude 3.5 Sonnet** AI reasoning, a **FastAPI** backend, and a **React + Vite** frontend to optimize retail reordering and prevent stockouts.

---

## 🚀 Live Demo & Deployment Links

| Resource | Link | Description |
| :--- | :--- | :--- |
| 🌐 **Live Application** | [restockai.vercel.app](https://restockai-4rc4.onrender.com) | Interactive React Web Application |
> 💡 *Replace the placeholder URLs above with your actual deployed frontend and backend links.*

---

## 🖼️ Application Screenshots & Output Showcase

### 🏠 Landing Page

<p align="center">
  <img src="https://github.com/user-attachments/assets/81174029-16f4-4f01-9629-8ca71d8fdd85" alt="RestockAI Landing Page" width="100%">
</p>

**Landing Page** — Platform overview and feature highlights.

---

### 📊 Executive Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/8b6e56b5-5b29-4c9e-b4d0-50d7d283efb8" alt="RestockAI Executive Dashboard" width="100%">
</p>

**Executive Dashboard** — Real-time analytics, demand statistics, and inventory status.

---

### 📈 Demand Forecasting

<p align="center">
  <img src="https://github.com/user-attachments/assets/7a2a4fae-d315-4028-aedd-d3a240f336e3" alt="RestockAI Demand Forecasting" width="100%">
</p>

**Demand Prediction** — 7/30-day forecasts, safety-stock metrics, and Claude AI-generated reasoning.

---

### 🏪 Store Intelligence

<p align="center">
  <img src="https://github.com/user-attachments/assets/df3f789d-e37c-452d-bfd0-6db6473228a2" alt="RestockAI Store Intelligence" width="100%">
</p>

**Store Intelligence** — Restock urgency matrix showing **CRITICAL**, **MODERATE**, and **HEALTHY** inventory conditions.


## ✨ Core Features 

- 📈 **Dual-Model Demand Forecasting**: Automatically evaluates **Prophet** (seasonality) and **XGBoost** (regression) per store-item pair and selects the best model using MAPE backtesting.
- 🤖 **AI-Powered Explanations**: Integrates **Anthropic Claude 3.5 Sonnet** to generate clear, 1-sentence decision rationales for inventory managers.
- ⚡ **Dynamic Safety Stock & Elasticity**: Calculates safety buffers, reorder points, and price elasticity promo lift dynamically.
- 🔐 **Multi-User Security & JWT Auth**: Secure authentication layer with `bcrypt` password hashing and isolated user data access.
- 📥 **ETL Pipeline**: Ingests raw sales CSVs, validates rows, quarantines errors, and performs efficient database upserts.
- 📊 **Flexible Exporting**: Export inventory recommendations to Google Sheets or CSV with a single click.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Lucide Icons
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2
- **ML / AI**: Facebook Prophet, XGBoost, Scikit-Learn, Anthropic Claude API
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **DevOps**: Docker, Docker Compose

---

## 🔒 Security & Sensitive Information Notice

- **No Secrets in Source**: Ensure `.env` is listed in your `.gitignore` and never committed to GitHub.
- **Environment Variables**: Sensitive keys (such as `ANTHROPIC_API_KEY`, `JWT_SECRET_KEY`, and database passwords) must be set via environment variables.

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/RestockAI.git
cd RestockAI
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
```

Edit `.env` to add your secret keys:
```env
ENVIRONMENT=development
DATABASE_URL=sqlite:///data/restockai.db
JWT_SECRET_KEY=your_secure_random_jwt_secret_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Run Backend API
```bash
uvicorn src.api.main:app --reload --port 8000
```
- API Server: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend Web App: `http://localhost:5173`

## 💤 Render Free Tier Keep-Alive

Because Render's free tier web services automatically spin down/sleep after 15 minutes of inactivity, a cold start can take 30–60+ seconds.

To prevent the backend server from sleeping, you can set up an external keep-alive cron job (e.g., using **[cron-job.org](https://cron-job.org)** or **[UptimeRobot](https://uptimerobot.com)**) to ping the public health check endpoint every 10 minutes:

```text
https://your-api-link.onrender.com/api/v1/health
```

The frontend client automatically handles cold starts gracefully by retrying once after a 2-second delay if the initial request times out or experiences a network error.

---

## 🐳 Docker Deployment

Run the complete application stack (Backend API + Database + ML Scheduler) using Docker Compose:

```bash
docker-compose up --build
```

---

## 🧪 Running Tests

```bash
pytest
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
