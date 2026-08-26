# 📦 RestockAI — Production Multi-User Prediction & Inventory Optimization Web Application

RestockAI is an end-to-end, production-grade **multi-user demand forecasting and inventory optimization platform**. It allows users to securely authenticate, define dynamic product/market parameters, execute real-time machine-learning inferences powered by **XGBoost Regressors & Elasticity Models**, inspect isolated prediction histories, and automate retail replenishment workflows.

---

## 🌐 Live Deployment & Demo Links

Access the deployed instances and documentation:

| Service | Link | Status |
| :--- | :--- | :--- |
| 🚀 **Live Web Application (Frontend)** | [https://restockai-app.vercel.app](https://restockai-app.vercel.app) *(Replace with your deployment URL)* | `Live / Production` |
| ⚡ **FastAPI Backend & Swagger API Docs** | [https://api.restockai.com/docs](https://api.restockai.com/docs) *(Replace with your API URL)* | `Active` |
| 🩺 **Backend Health Check** | [https://api.restockai.com/api/v1/health](https://api.restockai.com/api/v1/health) | `200 OK` |

---

## 🌟 Website Frontpage & Landing Portal

The RestockAI frontpage serves as the public entry point for visitors, providing an interactive showcase of platform features and an integrated authentication suite.

### Key Sections of the Frontpage:
* **Hero Banner & Value Proposition:** Highlighting real-time AI replenishment intelligence and ROI.
* **Interactive Feature Showcase:** Highlighting XGBoost forecasting, dynamic schema generation, and multi-store analytics.
* **Integrated Authentication Portal:** Embedded Login, Registration, and Password Reset cards with smooth tab switching.
* **Enterprise Security Highlights:** Visualizing zero cross-talk, bcrypt encryption, and JWT token authorization.

<!-- Frontpage Showcase (Add your landing page screenshot below) -->
<p align="center">
  <img width="1920" height="1080" alt="RestockAI Frontpage & Landing Portal" src="https://github.com/user-attachments/assets/790f3dff-4a1e-4fc6-bcf3-3d012db20a24" />
</p>

---

## 🚀 Key Features

* **🔐 Multi-User Authentication & Security**
  * Secure bcrypt password hashing with automatic salt generation.
  * Signed JWT bearer token authorization with strict per-user data isolation.
  * Registration, Login, Session Persistence, and Token-based Account Recovery workflows.

* **📈 Real-Time ML Demand Predictions (Non-Hardcoded)**
  * Dynamic input feature schema (`/api/v1/model/schema`) with live form generation.
  * Multi-feature preprocessing including price elasticity, promotional multipliers, lead times, seasonality, and demand volatility.
  * 90% statistical prediction intervals (`lower_bound` & `upper_bound`) and realistic confidence scoring.

* **📊 User Dashboard & Isolated Prediction History**
  * Personalized user workspace (`Welcome, <Name> 👋`).
  * Instant search, category filtering, column sorting, and pagination.
  * Detailed inspection of past model runs with complete parameter breakdowns.

* **💾 Saved Feature Datasets**
  * Save custom parameter scenarios.
  * Rerun saved scenarios with a single click.

* **🏬 Retail Store Replenishment Engine**
  * Multi-store inventory level monitoring.
  * Automated safety stock calculations.
  * AI-powered replenishment explanations with urgency ratings.
  * Google Sheets and CSV export support.

---

## 📋 What Data Is Used? (Simple & Easy Guide)

RestockAI uses everyday retail and store data to predict how many items you will sell and when you need to order more. You don't need a data science background to use it!

Here is a simple breakdown of the data types used:

### 1. 📥 Input Data (What You Provide to the AI)

| Data Name | Data Type | Example Value | Why the AI Needs It (In Simple Words) |
| :--- | :--- | :--- | :--- |
| **Store Location** | Selection (Text) | `Downtown Flagship` | Different store locations have different customer foot traffic and buying habits. |
| **Product Category** | Selection (Text) | `Groceries`, `Electronics` | Helps the AI understand how quickly this type of item usually sells (food sells faster than tech). |
| **Item Name** | Text (String) | `Organic Milk 1 Gallon` | A clear label so you can identify and track your product. |
| **Selling Price ($)** | Number (Decimal) | `$4.99` | Higher prices can lower demand, while lower prices increase demand (price elasticity). |
| **Wholesale Cost ($)** | Number (Decimal) | `$2.85` | What you pay the supplier, used to calculate profit margins and reorder costs. |
| **Current Stock on Hand** | Number (Whole count) | `45 units` | How many items are sitting on your shelves right now. |
| **Recent Daily Sales** | Number (Decimal) | `14.5 units / day` | Your baseline speed of sales over the past 30 days. |
| **Supplier Lead Time** | Number (Days) | `3 days` | How many days it takes for your supplier to deliver fresh stock after you order. |
| **Discount / Promotion** | Percentage (%) | `10% off` | Special discounts bring extra customers and boost sales temporarily. |
| **Season or Event** | Selection (Factor) | `Holiday Rush` or `Regular` | Tells the AI if a festival, weekend, or holiday will bring higher-than-normal sales. |
| **Forecast Horizon** | Time Window (Days) | `7 Days` or `30 Days` | How far into the future you want the forecast (next week or next month). |

---

### 2. 📤 Output Data (What the AI Gives Back to You)

Once the machine learning model finishes calculating, it produces clear, actionable results:

* 🎯 **Predicted Demand (Units):** The exact estimated number of units customers will buy during your chosen time period.
* 📊 **Confidence Interval (Low to High Range):** A safety range (e.g., *Between 105 and 125 units*) with 90% statistical certainty.
* 🛡️ **Safety Stock (Units):** Extra buffer stock recommended to keep on hand so you never run out during unexpected surges or delivery delays.
* 🛒 **Recommended Reorder Quantity:** The exact number of units you should order from your supplier today to stay fully stocked without over-ordering.
* ⚠️ **Stockout Risk Level:** A color-coded urgency tag (**LOW**, **MEDIUM**, or **HIGH / CRITICAL**) telling you if an item is about to go out of stock soon.

---

## 🖥️ Output & Application Screenshots

The following screenshots demonstrate the user interface across key modules:

---

### 1. 🌐 Landing Page & Frontpage
The public-facing portal for onboarding, feature overview, and secure authentication.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Landing Page" src="https://github.com/user-attachments/assets/790f3dff-4a1e-4fc6-bcf3-3d012db20a24" />
</p>

---

### 2. 📊 Dashboard
The personalized user dashboard providing an overview of demand forecasts, inventory alerts, and key performance indicators.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Dashboard" src="https://github.com/user-attachments/assets/790f3dff-4a1e-4fc6-bcf3-3d012db20a24" />
</p>

---

### 3. 🔮 Prediction Studio
Allows users to enter dynamic product and market parameters such as price, promotion discounts, lead time, seasonality, and demand volatility to generate real-time inferences.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Prediction Studio" src="https://github.com/user-attachments/assets/2b012936-0088-4b68-aada-16361ae2b0d0" />
</p>

---

### 4. 📈 Prediction History
Search, filter, sort, and inspect past prediction runs with complete transparency on model inputs and confidence metrics.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Prediction History" src="https://github.com/user-attachments/assets/bfeffb4f-b49a-49f0-bc31-4458b5bc7c92" />
</p>

---

### 5. 🏬 Store Replenishment
Monitors multi-store inventory levels and generates AI-assisted reorder quantities with safety stock calculations.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Store Replenishment" src="https://github.com/user-attachments/assets/26fec34e-ab29-4798-8205-a372f5d56ae3" />
</p>

---

### 6. 👤 User Profile & Settings
Manage account credentials, view user ID, role permissions, and active session status.

<p align="center">
  <img width="1920" height="1080" alt="RestockAI Profile" src="https://github.com/user-attachments/assets/f0992b0b-e719-4ba8-b5c1-8a2af8789761" />
</p>

---

## 🛠️ Architecture & Tech Stack

```text
RestockAI/
├── src/
│   ├── api/
│   │   ├── auth.py          # JWT authentication & password hashing
│   │   ├── main.py          # FastAPI application entrypoint
│   │   ├── routes.py        # API endpoints (predictions, stores, user-data)
│   │   └── schemas.py       # Pydantic request/response models
│   │
│   ├── database/
│   │   ├── connection.py    # Database engine & session management
│   │   └── models.py        # SQLAlchemy relational data models
│   │
│   ├── ml_engine/
│   │   ├── prediction_service.py  # Inference orchestration
│   │   ├── xgboost_model.py       # ML regression models & pipeline
│   │   ├── features.py            # Feature engineering & transformations
│   │   └── forecast_pipeline.py   # Forecast calculation pipeline
│   │
│   └── utils/
│       ├── config.py        # Environment configuration
│       ├── security.py      # Token encoding/decoding & bcrypt hashing
│       └── logger.py        # Structured logging setup
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global authentication state
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptors
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Website Frontpage & Auth
│   │   │   ├── Dashboard.jsx     # Overview & analytics
│   │   │   ├── PredictionStudio.jsx # Live ML form
│   │   │   ├── PredictionHistory.jsx# Historical runs
│   │   │   ├── StoreReplenishment.jsx # Inventory reorder engine
│   │   │   └── Profile.jsx       # Account management
│   │   └── App.jsx
│
└── tests/                   # Automated pytest suite
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

API requests are proxied automatically to:
```text
http://localhost:8000/api/v1
```

---

## 🧪 Testing Instructions

Run the complete test suite covering authentication, token authorization, dynamic ML inference, and multi-user data isolation:

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
| `POST`   | `/api/v1/auth/reset-password`        | Reset password with valid token     |       No      |
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

* **🔐 Salted Password Hashing:** Passwords hashed with bcrypt (12 rounds).
* **👤 Strict Data Isolation:** Relational queries strictly filter by authenticated `user_id`.
* **🎫 JWT Expiration & Verification:** Secure expiration policies with HS256 signature checks.
* **🛡️ Zero Cross-Talk:** Models, history records, and custom datasets are inaccessible across accounts.

---

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

* Advanced time-series forecasting models (Prophet / DeepAR)
* Automated model retraining triggers
* Real-time inventory synchronization via WebSockets
* Advanced demand anomaly detection
* Role-based access control (RBAC)
* Containerized multi-cloud deployment (Docker & Kubernetes)
* Automated email/SMS low-stock alert webhooks

---

## 👨‍💻 Author

**Suprit Totiger**

Built as an end-to-end AI/ML and full-stack application demonstrating:
**Machine Learning + Backend Development + Frontend Development + Database Design + Authentication + Inventory Optimization**
