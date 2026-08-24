# 📦 RestockAI — Production Multi-User Prediction & Inventory Optimization Web Application

RestockAI is an end-to-end, production-ready **multi-user prediction and demand forecasting platform**. It allows different users to securely register, log in, define dynamic product/market parameters, execute live machine-learning inferences powered by **XGBoost Regressors & Elasticity Models**, inspect isolated prediction histories, and manage inventory reorder decisions with automated AI reasoning.

---

## 🚀 Key Features

* **🔐 Multi-User Authentication & Security**

  * Secure bcrypt password hashing with salt.
  * Signed JWT bearer token authentication with strict per-user data isolation.
  * Registration, Login, Session Persistence, and Account Recovery workflows.

* **📈 Real-Time ML Demand Predictions (Non-Hardcoded)**

  * Dynamic input feature schema (`/api/v1/model/schema`) with live form generation.
  * Multi-feature preprocessing including price elasticity, promotions, lead time, seasonality, and volatility.
  * 90% statistical prediction intervals (`lower_bound` & `upper_bound`) and realistic confidence scoring.

* **📊 User Dashboard & Isolated Prediction History**

  * Personalized user workspace (`Welcome, <Name> 👋`).
  * Search, category filtering, sorting, and pagination.
  * Detailed inspection of past model runs with complete feature parameter breakdowns.

* **💾 Saved Feature Datasets**

  * Save custom parameter scenarios.
  * Rerun saved scenarios with one click.

* **🏬 Retail Store Replenishment Engine**

  * Multi-store inventory monitoring.
  * Safety stock calculations.
  * AI-powered replenishment explanations.
  * Google Sheets and CSV export.

---

## 🛠️ Architecture & Tech Stack

```text
RestockAI/
├── src/
│   ├── api/
│   │   ├── auth.py
│   │   ├── main.py
│   │   ├── routes.py
│   │   └── schemas.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   └── models.py
│   │
│   ├── ml_engine/
│   │   ├── prediction_service.py
│   │   ├── xgboost_model.py
│   │   ├── features.py
│   │   └── forecast_pipeline.py
│   │
│   └── utils/
│       ├── config.py
│       ├── security.py
│       └── logger.py
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── pages/
│   │   └── App.jsx
│
└── tests/
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites

* Python 3.10+
* Node.js 18+

### 2. Backend Setup

```bash
# Clone repository
git clone https://github.com/yourusername/RestockAI.git
cd RestockAI

# Create virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI server
python -m uvicorn src.api.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at:

```text
http://localhost:5173
```

The frontend automatically proxies API calls to:

```text
http://localhost:8000/api/v1
```

---

## 🧪 Testing Instructions

Run the complete test suite covering authentication, token authorization, dynamic ML inference, and multi-user data isolation.

```bash
# Run all tests
pytest -v tests/

# Run multi-user prediction & isolation tests
pytest -v tests/test_multi_user_prediction.py
```

---

## 🔌 API Endpoints Summary

| Method   | Endpoint                             | Description                         | Auth Required |
| :------- | :----------------------------------- | :---------------------------------- | :-----------: |
| `POST`   | `/api/v1/auth/register`              | Register new user account           |       No      |
| `POST`   | `/api/v1/auth/login`                 | Authenticate & issue JWT            |       No      |
| `GET`    | `/api/v1/auth/me`                    | Fetch authenticated profile         |      Yes      |
| `POST`   | `/api/v1/auth/forgot-password`       | Request password reset token        |       No      |
| `GET`    | `/api/v1/model/schema`               | Fetch dynamic ML feature schema     |       No      |
| `POST`   | `/api/v1/predictions`                | Execute ML prediction for user      |      Yes      |
| `GET`    | `/api/v1/predictions`                | List authenticated user predictions |      Yes      |
| `GET`    | `/api/v1/predictions/{id}`           | Inspect specific prediction details |      Yes      |
| `DELETE` | `/api/v1/predictions/{id}`           | Delete user's prediction            |      Yes      |
| `POST`   | `/api/v1/user-data`                  | Save input feature dataset          |      Yes      |
| `GET`    | `/api/v1/user-data`                  | List saved datasets                 |      Yes      |
| `DELETE` | `/api/v1/user-data/{id}`             | Delete saved dataset                |      Yes      |
| `GET`    | `/api/v1/health`                     | System health check                 |       No      |
| `GET`    | `/api/v1/stores`                     | List monitored stores               |       No      |
| `GET`    | `/api/v1/recommendations/{store_id}` | Store replenishment recommendations |       No      |

---

## 🔒 Security Best Practices

* **🔐 Never Plaintext:** All passwords are hashed using bcrypt with 12 rounds.
* **👤 Zero Cross-Talk:** Database queries strictly filter by authenticated `user_id`.
* **🎫 JWT Protection:** Secure expiration times and HS256 signature verification.
* **🛡️ User Data Isolation:** Predictions and saved datasets are accessible only to their respective authenticated users.

---

# 🖥️ Output & Application Screenshots

The following screenshots demonstrate the major features and user interface of the RestockAI application.

---

## 1. 📊 Dashboard

The personalized dashboard provides users with an overview of prediction activity, demand forecasts, inventory insights, and key performance metrics.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Dashboard" src="https://github.com/user-attachments/assets/790f3dff-4a1e-4fc6-bcf3-3d012db20a24" />
</p>

---

## 2. 🔮 Prediction Studio

The Prediction Studio allows users to enter dynamic product and market parameters such as price, promotions, lead time, seasonality, and demand volatility.

The ML engine generates real-time demand predictions with prediction intervals and confidence scores.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Prediction Studio" src="https://github.com/user-attachments/assets/2b012936-0088-4b68-aada-16361ae2b0d0" />
</p>

---

## 3. 📈 Prediction History

Users can search, filter, sort, and inspect their previous prediction runs. Each prediction contains the corresponding feature parameters and prediction results.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Prediction History" src="https://github.com/user-attachments/assets/bfeffb4f-b49a-49f0-bc31-4458b5bc7c92" />
</p>

---

## 4. 🏬 Store Replenishment

The Store Replenishment module monitors inventory across multiple stores and provides AI-powered reorder recommendations using demand forecasts and safety-stock calculations.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Store Replenishment" src="https://github.com/user-attachments/assets/26fec34e-ab29-4798-8205-a372f5d56ae3" />
</p>

---

## 5. 👤 Profile

The Profile section allows users to manage their account information and view their personal details and account settings.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Profile" src="https://github.com/user-attachments/assets/f0992b0b-e719-4ba8-b5c1-8a2af8789761" />
</p>


## 🚀 Project Highlights

* 🔐 Secure multi-user authentication
* 👤 Strict user-level data isolation
* 🎫 JWT-based authorization
* 📈 XGBoost-based demand prediction
* 🧠 Price elasticity modeling
* 📊 Dynamic prediction feature schema
* 📉 Statistical prediction intervals
* 💾 Saved prediction scenarios
* 🏬 Multi-store inventory optimization
* 🤖 AI-powered replenishment reasoning
* 📤 CSV and Google Sheets export
* ⚡ FastAPI backend
* ⚛️ React frontend
* 🗄️ SQLAlchemy database layer
* 🧪 Automated pytest test suite

---

## 📌 Future Improvements

* Advanced time-series forecasting models
* Automated model retraining
* Real-time inventory synchronization
* Advanced demand anomaly detection
* Role-based access control
* Cloud deployment with Docker
* Monitoring and observability dashboards
* Automated email notifications for low-stock items

---

## 👨‍💻 Author

**Suprit Totiger**

Built as an end-to-end AI/ML and full-stack application demonstrating:

**Machine Learning + Backend Development + Frontend Development + Database Design + Authentication + Inventory Optimization**
