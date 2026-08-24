# 📦 RestockAI — Production Multi-User Prediction & Inventory Optimization Web Application

RestockAI is an end-to-end, production-ready **multi-user prediction and demand forecasting platform**. It allows different users to securely register, log in, define dynamic product/market parameters, execute live machine-learning inferences powered by **XGBoost Regressors & Elasticity Models**, inspect isolated prediction histories, and manage inventory reorder decisions with automated AI reasoning.

---

## 🚀 Key Features

- **🔐 Multi-User Authentication & Security**:
  - Secure bcrypt password hashing with salt.
  - Signed JWT bearer token authentication with strict per-user data isolation.
  - Registration, Login, Session Persistence, and Account Recovery workflows.
- **📈 Real-Time ML Demand Predictions (Non-Hardcoded)**:
  - Dynamic input feature schema (`/api/v1/model/schema`) with live form generation.
  - Multi-feature preprocessing (price elasticity, promotions, lead time, seasonality, volatility).
  - 90% statistical prediction intervals (`lower_bound` & `upper_bound`) and realistic confidence scoring.
- **📊 User Dashboard & Isolated Prediction History**:
  - Personalized user workspace (`Welcome, <Name> 👋`).
  - Search, category filtering, sorting, and pagination.
  - Detailed inspection of past model runs with full feature parameter breakdowns.
- **💾 Saved Feature Datasets**:
  - Save custom parameter scenarios and rerun predictions with one click.
- **🏬 Retail Store Replenishment Engine**:
  - Multi-store inventory monitoring with safety stock calculations and Claude LLM explanations.
  - One-click Google Sheets and CSV export.

---

## 🛠️ Architecture & Tech Stack

```
RestockAI/
├── src/
│   ├── api/
│   │   ├── auth.py              # JWT authentication & security dependencies
│   │   ├── main.py              # FastAPI server & SPA static handler
│   │   ├── routes.py            # Auth, prediction, user-data, & store endpoints
│   │   └── schemas.py           # Pydantic v2 schemas & request/response models
│   ├── database/
│   │   ├── connection.py        # SQLAlchemy engine & session management
│   │   └── models.py            # User, UserData, Prediction, Store, Item models
│   ├── ml_engine/
│   │   ├── prediction_service.py # Dynamic schema & inference engine
│   │   ├── xgboost_model.py     # XGBoost time-series regressor
│   │   ├── features.py          # Feature engineering pipeline
│   │   └── forecast_pipeline.py # Batch training & backtesting
│   └── utils/
│       ├── config.py            # Application settings & environment variables
│       ├── security.py          # Bcrypt hashing & JWT utilities
│       └── logger.py            # Centralized logging
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx # Authentication state & session manager
│   │   ├── services/api.js      # Centralized API client with JWT headers
│   │   ├── pages/               # Login, Register, Dashboard, AddData, History, etc.
│   │   └── App.jsx              # Master responsive layout & routing
└── tests/                       # Automated pytest test suites
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Clone repository
git clone https://github.com/yourusername/RestockAI.git
cd RestockAI

# Create virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI Server
python -m uvicorn src.api.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will start at **http://localhost:5173** and automatically proxy API calls to **http://localhost:8000/api/v1**.

---

## 🧪 Testing Instructions

Run the complete test suite covering authentication, token authorization, dynamic ML inference, and multi-user data isolation:

```bash
# Run all tests
pytest -v tests/

# Run multi-user prediction & isolation tests specifically
pytest -v tests/test_multi_user_prediction.py
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate & issue JWT | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated profile | Yes |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | No |
| `GET` | `/api/v1/model/schema` | Fetch dynamic ML feature schema | No |
| `POST` | `/api/v1/predictions` | Execute ML prediction for user | Yes |
| `GET` | `/api/v1/predictions` | List authenticated user predictions | Yes |
| `GET` | `/api/v1/predictions/{id}` | Inspect specific prediction details | Yes |
| `DELETE` | `/api/v1/predictions/{id}` | Delete user's prediction | Yes |
| `POST` | `/api/v1/user-data` | Save input feature dataset | Yes |
| `GET` | `/api/v1/user-data` | List saved datasets | Yes |
| `DELETE` | `/api/v1/user-data/{id}` | Delete saved dataset | Yes |
| `GET` | `/api/v1/health` | System health check | No |
| `GET` | `/api/v1/stores` | List monitored stores | No |
| `GET` | `/api/v1/recommendations/{store_id}` | Store replenishment recommendations | No |

---

## 🔒 Security Best Practices
- **Never Plaintext**: All passwords hashed using bcrypt (12 rounds).
- **Zero Cross-Talk**: Database queries strictly filter by authenticated `user_id`.
- **JWT Protection**: Secure expiration times and HS256 signature verification.
- # 🖥️ Output & Application Screenshots

RestockAI provides a modern, responsive interface for managing predictions, demand forecasting, inventory decisions, and user-specific data.

## 1. 📊 Dashboard

The personalized dashboard gives users a quick overview of their prediction activity, demand forecasts, inventory insights, and key performance metrics.

![RestockAI Dashboard](<img width="1920" height="1080" alt="Screenshot (60)" src="https://github.com/user-attachments/assets/790f3dff-4a1e-4fc6-bcf3-3d012db20a24" />
)

---

## 2. 🔮 Prediction Studio

The Prediction Studio allows users to dynamically enter product and market parameters such as price, promotions, lead time, seasonality, and demand volatility. The ML engine generates real-time demand predictions along with confidence intervals.

![RestockAI Prediction Studio](<img width="1920" height="1080" alt="Screenshot (61)" src="https://github.com/user-attachments/assets/2b012936-0088-4b68-aada-16361ae2b0d0" />
)

---

## 3. 📈 Prediction History

Users can view, search, filter, sort, and inspect their previous prediction runs. Every prediction is isolated to the authenticated user and includes the complete feature parameter breakdown.

![RestockAI Prediction History](<img width="1920" height="1080" alt="Screenshot (62)" src="https://github.com/user-attachments/assets/bfeffb4f-b49a-49f0-bc31-4458b5bc7c92" />
)

---

## 4. 🏬 Store Replenishment

The Store Replenishment module monitors inventory across multiple stores and provides AI-powered reorder recommendations using safety-stock calculations, demand forecasts, and intelligent reasoning.

![RestockAI Store Replenishment](<img width="1920" height="1080" alt="Screenshot (63)" src="https://github.com/user-attachments/assets/26fec34e-ab29-4798-8205-a372f5d56ae3" />
)

---

## 5. 👤 Profile

The Profile section allows users to manage their account information, view their personal details, and manage account-related settings securely.

![RestockAI Profile](<img width="1920" height="1080" alt="Screenshot (64)" src="https://github.com/user-attachments/assets/f0992b0b-e719-4ba8-b5c1-8a2af8789761" />
)

### 📁 Screenshot Directory

Store the application screenshots in the following structure:

```text
RestockAI/
└── screenshots/
    ├── dashboard.png
    ├── prediction-studio.png
    ├── prediction-history.png
    ├── store-replenishment.png
    └── profile.png
```

> **Note:** Replace the placeholder screenshot files with actual screenshots from the running RestockAI application.
