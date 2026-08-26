# RestockAI - Complete Project Guide

> A step-by-step explanation of every file, how they connect, and how the full system works.

---

## Table of Contents

1. [What Does This Project Do?](#1-what-does-this-project-do)
2. [How the System Works (Big Picture)](#2-how-the-system-works-big-picture)
3. [Full Project File Tree](#3-full-project-file-tree)
4. [Step 1 - Database Foundation](#4-step-1---database-foundation)
5. [Step 2 - Data Generation and ETL Pipeline](#5-step-2---data-generation-and-etl-pipeline)
6. [Step 3 - Machine Learning Engine](#6-step-3---machine-learning-engine)
7. [Step 4 - API Backend (FastAPI)](#7-step-4---api-backend-fastapi)
8. [Step 5 - LLM Reasoning (Claude AI)](#8-step-5---llm-reasoning-claude-ai)
9. [Step 6 - Google Sheets Export](#9-step-6---google-sheets-export)
10. [Step 7 - React Frontend Dashboard](#10-step-7---react-frontend-dashboard)
11. [Step 8 - Tests](#11-step-8---tests)
12. [Step 9 - DevOps and Docker](#12-step-9---devops-and-docker)
13. [Data Flow: End-to-End Journey](#13-data-flow-end-to-end-journey)
14. [How to Run the Project](#14-how-to-run-the-project)
15. [Environment Variables Reference](#15-environment-variables-reference)

---

## 1. What Does This Project Do?

**RestockAI** is a smart retail inventory management system for store managers.

### The Problem It Solves

Retail stores lose money two ways:
- **Overstock** - ties up cash, product expires or goes to waste
- **Understock (Stockout)** - customers leave empty-handed, revenue lost

### The Solution

RestockAI **predicts future demand** for every item in every store using machine learning, then tells the store manager **exactly how many units to reorder**, and explains **why** in plain English (powered by Claude AI).

### Key Output for a Manager

```
Item: Premium Olive Oil (Condiments)
Current Stock: 12 units
7-Day Demand Forecast: 47 units
Recommended Reorder: 43 units
Status: CRITICAL - Will stock out in 1.8 days
AI Explanation: "Urgent reorder of 43 units required - current stock (12 units) will
exhaust in 1.8 days at current demand velocity of 6.7 units/day."
```

---

## 2. How the System Works (Big Picture)

```
+------------------------------------------------------------------+
|                        RestockAI System                          |
|                                                                  |
|  [CSV Files]  ==>  [ETL Pipeline]  ==>  [SQLite / PostgreSQL DB] |
|  (POS Data)        (Clean/Validate)                    |         |
|                                                        |         |
|  [Retraining] <==  [Model Evaluator] <==  [Prophet &   v         |
|  [Scheduler]                              XGBoost ML]            |
|                                                        |         |
|  [Claude 3.5] <=>  [FastAPI Backend]  ==>  [React Dashboard]     |
|  LLM (AI)                                 (Web UI)               |
|                           |                                      |
|                    [Google Sheets / CSV Export]                   |
+------------------------------------------------------------------+
```

---

## 3. Full Project File Tree

```
RestockAI/
|
+-- .env.example              # Environment variable template (API keys, DB URL)
+-- .gitignore                # Files excluded from version control
+-- requirements.txt          # All Python package dependencies
+-- docker-compose.yml        # Runs all services together (DB + API + Scheduler)
|
+-- assets/                   # Screenshots for README
|
+-- data/                     # All data files
|   +-- schema.sql            # Raw SQL table definitions (portable ANSI SQL)
|   +-- restockai.db          # SQLite database file (auto-created on first run)
|   +-- raw/                  # Input CSV files from POS systems
|   |   +-- stores.csv
|   |   +-- items.csv
|   |   +-- sales_*.csv
|   +-- quarantine/           # Bad/rejected rows isolated here (not deleted)
|   +-- exports/              # Generated CSV exports for manager download
|
+-- docker/                   # Dockerfiles for each service
|   +-- Dockerfile.api        # FastAPI server container
|   +-- Dockerfile.ml         # ML training container
|   +-- Dockerfile.etl        # ETL pipeline container
|
+-- frontend/                 # React 18 + Vite web dashboard
|   +-- index.html            # HTML entry point
|   +-- package.json          # Node.js dependencies
|   +-- vite.config.js        # Vite build config
|   +-- src/
|       +-- App.jsx           # Main React component (entire UI)
|       +-- main.jsx          # React app bootstrap
|       +-- index.css         # Global CSS design system
|
+-- src/                      # All Python backend source code
|   +-- __init__.py
|   |
|   +-- database/             # Database layer
|   |   +-- __init__.py
|   |   +-- models.py         # SQLAlchemy ORM table definitions
|   |   +-- connection.py     # DB engine and session management
|   |
|   +-- data_pipeline/        # Data ingestion and ETL
|   |   +-- __init__.py
|   |   +-- generate_synthetic_data.py  # Creates fake realistic POS data
|   |   +-- schema_validator.py         # Row-by-row data validation rules
|   |   +-- etl.py                      # Main ETL pipeline (read -> validate -> load)
|   |
|   +-- ml_engine/            # Machine learning forecasting
|   |   +-- features.py       # Feature engineering (lags, rolling stats, calendar)
|   |   +-- prophet_model.py  # Facebook Prophet time-series model
|   |   +-- xgboost_model.py  # XGBoost regression model
|   |   +-- evaluator.py      # Compares Prophet vs XGBoost, picks winner
|   |   +-- forecast_pipeline.py  # Full pipeline: train -> evaluate -> save forecasts
|   |   +-- retrain_scheduler.py  # Automated weekly retraining scheduler
|   |
|   +-- api/                  # FastAPI web server
|   |   +-- main.py           # App startup, middleware, CORS, static files
|   |   +-- routes.py         # All API endpoint logic
|   |   +-- schemas.py        # Pydantic request/response data models
|   |   +-- llm_explainer.py  # Claude 3.5 AI restock explanation generator
|   |
|   +-- frontend/             # Backend services for frontend
|   |   +-- sheets_exporter.py  # Google Sheets / CSV export service
|   |
|   +-- utils/                # Shared utilities
|       +-- config.py         # Reads .env settings (API keys, DB URL, etc.)
|       +-- logger.py         # Structured logging setup
|
+-- tests/                    # Automated test suite
|   +-- __init__.py
|   +-- test_api.py           # Tests for all FastAPI endpoints
|   +-- test_etl.py           # Tests for ETL pipeline and data validation
|   +-- test_ml_forecasting.py  # Tests for ML models and forecast pipeline
|
+-- .github/
    +-- workflows/
        +-- ci-cd.yml         # GitHub Actions: auto-run tests and build Docker on push
```

---

## 4. Step 1 - Database Foundation

> **Where:** `src/database/` and `data/schema.sql`

The database is the central store for ALL data — raw sales, items, stores, forecasts, and system logs.

---

### `data/schema.sql` - Raw SQL Table Definitions

This file defines the exact table structure in ANSI SQL. It works with both SQLite (for local dev) and PostgreSQL (for production).

**Tables:**

| Table | What It Stores |
|:------|:---------------|
| `stores` | All 50 retail store locations with name and region |
| `items` | All 200 products with name, category, and unit cost |
| `sales_daily` | Daily POS transaction: how many units sold and stock left |
| `forecasts` | ML model predictions: 7-day and 30-day demand per store/item |
| `system_logs` | Audit trail of ETL runs, ML training events, and errors |

---

### `src/database/models.py` - Python ORM Models

Instead of writing raw SQL everywhere, Python uses **SQLAlchemy ORM** classes that mirror the database tables.

```
Store          ->  stores table
Item           ->  items table
SalesDaily     ->  sales_daily table
Forecast       ->  forecasts table
SystemLog      ->  system_logs table
```

**Key relationships:**
- `Store` has many `SalesDaily` and many `Forecast` records
- `Item` has many `SalesDaily` and many `Forecast` records
- `SalesDaily` has a **composite primary key**: `(store_id, item_id, date)` — ensuring no duplicate daily records

**The `Forecast` table stores:**

| Column | Meaning |
|:-------|:--------|
| `forecast_id` | Unique ID, e.g., `"FCST_STORE1_ITEM42_7D_2026-08-22"` |
| `store_id` | Which store |
| `item_id` | Which item |
| `horizon_days` | `7` (weekly) or `30` (monthly) |
| `predicted_demand` | ML model's demand prediction |
| `lower_bound` | Uncertainty lower range |
| `upper_bound` | Uncertainty upper range |
| `model_used` | `"Prophet"` or `"XGBoost"` |
| `model_mape` | Mean Absolute Percentage Error (accuracy) |
| `model_rmse` | Root Mean Squared Error (accuracy) |

---

### `src/database/connection.py` - Database Connection Management

- Creates the SQLAlchemy **engine** (connects to SQLite or PostgreSQL based on `.env`)
- Provides `get_db()` dependency injection for FastAPI routes
- Provides `get_db_session()` context manager for ML pipeline and ETL code
- `init_db()` creates all tables automatically on first run and auto-seeds default demo accounts (`suprit@restockai.io` and `analyst@company.com`)

---

## 5. Step 2 - Data Generation and ETL Pipeline

> **Where:** `src/data_pipeline/`

This step is responsible for getting data **into** the database.

---

### `src/data_pipeline/generate_synthetic_data.py` - Synthetic Data Generator

Since real POS data is not available, this script **generates realistic fake retail data**.

**What it generates:**
- **50 stores** across 5 regions (North, South, East, West, Central)
- **200 items** across 8 retail categories (Electronics, Clothing, Condiments, etc.)
- **Daily sales records** with:
  - Seasonal demand curves (higher sales in winter months)
  - Weekly spikes (weekends sell more)
  - Holiday surges (Christmas, Black Friday, etc.)
  - Promotional pricing effects
  - Stockout cycles (stock runs out and gets replenished)

**Output files saved to `data/raw/`:**
```
data/raw/stores.csv
data/raw/items.csv
data/raw/sales_2024.csv
data/raw/sales_2025.csv
```

**Run it:**
```bash
python -m src.data_pipeline.generate_synthetic_data
```

---

### `src/data_pipeline/schema_validator.py` - Data Validation

Before any data touches the database, **every row is validated** against strict rules.

**Validation rules:**
- `store_id` must not be null or empty
- `units_sold` must be a non-negative integer
- `price` must be a positive number
- `date` must be a valid date format
- `stock_on_hand` must be >= 0

**What happens to bad rows?**
- Valid rows -> passed to ETL for loading into database
- Invalid rows -> saved to `data/quarantine/` with the rejection reason. The pipeline does NOT crash.

---

### `src/data_pipeline/etl.py` - The ETL Pipeline

**ETL = Extract -> Transform -> Load**

```
EXTRACT:   Read stores.csv, items.csv, sales*.csv from data/raw/
TRANSFORM: Validate each row with SchemaValidator (quarantine bad rows)
LOAD:      Bulk upsert clean data into database
```

**How it handles large files:**
- Sales files are read in **chunks of 50,000 rows** to avoid memory issues
- Uses **UPSERT** (Insert Or Replace) so running ETL twice does not create duplicates
- Works on SQLite (`INSERT OR REPLACE`) and PostgreSQL (`ON CONFLICT DO UPDATE`)

**After ETL completes, it logs stats to `system_logs`:**
```json
{
  "stores": {"ingested": 50, "loaded": 50, "quarantined": 0},
  "items":  {"ingested": 200, "loaded": 200, "quarantined": 0},
  "sales":  {"ingested": 365000, "loaded": 364987, "quarantined": 13}
}
```

**Run it:**
```bash
python -m src.data_pipeline.etl
```

---

## 6. Step 3 - Machine Learning Engine

> **Where:** `src/ml_engine/`

This is the brain of RestockAI. It trains models to **predict future demand** for each store-item pair.

---

### `src/ml_engine/features.py` - Feature Engineering

Raw sales data (`date`, `units_sold`, `price`) is transformed into rich ML features.

**Features created:**

| Feature Type | Features Created | Why It Helps |
|:-------------|:----------------|:-------------|
| Calendar | `day_of_week`, `month`, `is_weekend` | Demand changes by day/season |
| Fourier | `sin_doy`, `cos_doy` | Smooth annual seasonality cycles |
| Lag Features | `lag_1`, `lag_2`, `lag_7`, `lag_14`, `lag_21`, `lag_28` | "What sold N days ago?" |
| Rolling Stats | `rolling_mean_7`, `rolling_mean_14`, `rolling_mean_30`, `rolling_std_7` | Recent trends and volatility |
| Price | `price` | Demand changes when price changes |

> **Important:** All lags and rolling stats use `shift(1)` to prevent **data leakage** — the model never uses future data to predict the past.

---

### `src/ml_engine/prophet_model.py` - Facebook Prophet Model

**Prophet** is designed for time-series forecasting with built-in seasonality support.

**What it models:**
- Weekly seasonality — sales spike on weekends
- Annual seasonality — holiday seasons, summer/winter cycles
- Trend — is overall demand growing or declining?

**How it works:**
1. Takes historical `date` + `units_sold` for one store-item pair
2. Fits a Prophet model (needs at least 14 days of history)
3. Generates 30 future daily predictions
4. Returns `predicted_demand`, `lower_bound`, `upper_bound` for each day

**Fallback:** If Prophet fails (e.g., too little data), it falls back to **Holt-Winters** exponential smoothing from statsmodels.

---

### `src/ml_engine/xgboost_model.py` - XGBoost Model

**XGBoost** is a gradient boosting tree model — excellent at capturing nonlinear patterns and lag dependencies.

**How it works:**
1. Uses `FeatureEngineer.create_features()` to build the feature matrix
2. Trains an `XGBRegressor` on historical data
3. Predicts one day at a time for 30 days into the future (recursive forecasting: each predicted day becomes a lag feature for the next)
4. Returns predictions with confidence bounds

**XGBoost wins when:** there are complex nonlinear relationships between lags, prices, and calendar features.

---

### `src/ml_engine/evaluator.py` - Model Evaluator (Which Model Wins?)

This is the **referee** between Prophet and XGBoost.

**How it works:**
```
Historical data (e.g., 180 days)
    |
    +-- Training set: Day 1 to Day 166
    +-- Test set: Day 167 to Day 180 (last 14 days)
         |
         +-- Train Prophet -> predict last 14 days -> calculate MAPE
         +-- Train XGBoost -> predict last 14 days -> calculate MAPE
              |
              +-- Whichever has LOWER MAPE wins
                  -> Retrain winner on FULL data
                  -> Use for future forecasts
```

**Metrics used:**
- **MAPE** (Mean Absolute Percentage Error) - Primary model selector
- **RMSE** (Root Mean Squared Error) - Secondary metric, stored for reference

---

### `src/ml_engine/forecast_pipeline.py` - Full ML Pipeline Orchestrator

This is the **main script that runs all ML work** in sequence.

```
1. Fetch all (store_id, item_id) pairs from database
2. Load all historical sales data into a DataFrame
3. For each store-item pair:
   a. Run ModelEvaluator -> pick best model (Prophet or XGBoost)
   b. Retrain winner on full historical data
   c. Predict 30 days ahead
   d. Save 7-day forecast record to database
   e. Save 30-day forecast record to database
4. Log pipeline stats to system_logs table
```

**Run it:**
```bash
python -m src.ml_engine.forecast_pipeline
```

---

### `src/ml_engine/retrain_scheduler.py` - Automated Retraining

Uses Python's `schedule` library to **automatically retrain models every week**.

```python
# Runs every Monday at 2:00 AM
schedule.every().monday.at("02:00").do(run_pipeline)
```

This ensures forecasts stay fresh as new POS sales data arrives.

---

## 7. Step 4 - API Backend (FastAPI)

> **Where:** `src/api/`

The FastAPI backend is the **central hub** connecting the database, ML forecasts, and LLM to the web frontend.

---

### `src/api/main.py` - Application Entry Point

**What it sets up:**
- Creates the FastAPI `app` instance
- **Rate limiting** via SlowAPI: max 120 requests/minute per IP
- **CORS middleware**: allows the React frontend (localhost:5173) to call the API
- **Static file serving**: serves the built React app from `frontend/dist/`
- **Export directory**: creates `data/exports/` for CSV downloads
- **Request timing middleware**: adds `X-Process-Time-Ms` header to every response
- **Database initialization**: calls `init_db()` on startup to create tables automatically

**Start the server:**
```bash
python -m src.api.main
```

---

### `src/api/routes.py` - All API Endpoints

This is where all the **business logic** lives for each HTTP endpoint.

---

#### `GET /api/v1/health`

Checks if the database is connected and returns system counts.

```json
{
  "status": "healthy",
  "database_connected": true,
  "total_stores": 50,
  "total_items": 200,
  "total_forecasts": 20000
}
```

---

#### `GET /api/v1/stores`

Returns a list of all 50 retail stores.

---

#### `GET /api/v1/recommendations/{store_id}` (Most Important Endpoint)

Powers the main dashboard. **What it does for each item:**

1. Gets current `stock_on_hand` from the latest sales record
2. Fetches 7-day and 30-day ML forecasts from the database
3. Calculates **daily run rate** = `predicted_demand_7d / 7`
4. Calculates **stockout days** = `current_stock / daily_run_rate`
5. Calculates **safety stock** = `daily_run_rate x 2.5 days`
6. Calculates **recommended reorder** = `max(0, ceil(demand_7d + safety_stock - current_stock))`
7. Assigns **urgency level:**
   - `CRITICAL` -> stockout in 2 days or less
   - `MODERATE` -> stockout in 4.5 days or less
   - `HEALTHY` -> stock is sufficient
8. Calls Claude LLM to generate a plain-English explanation
9. Returns all items **sorted** by urgency (Critical items first)

---

#### `GET /api/v1/recommendations/{store_id}/{item_id}`

Deep-dive into a single item — same logic but for one specific product.

---

#### `POST /api/v1/export/sheets/{store_id}`

Triggers Google Sheets (or CSV fallback) export for a store's restock orders.

---

#### `POST /api/v1/forecast/train`

Triggers on-demand ML model retraining. Used when you want fresh forecasts without waiting for the weekly scheduler.

---

### `src/api/schemas.py` - Request and Response Data Models

Defines the **exact shape** of data going in and out of the API using Pydantic v2.

**Key response schema:**

```
RecommendationItemResponse:
    item_id, name, category
    unit_cost, current_price
    stock_on_hand
    predicted_demand_7d, predicted_demand_30d
    lower_bound_7d, upper_bound_7d      <- confidence interval
    recommended_reorder_qty
    stockout_risk_days
    urgency                             <- "CRITICAL" | "MODERATE" | "HEALTHY"
    model_used                          <- "Prophet" | "XGBoost"
    explanation                         <- Claude AI text
```

---

## 8. Step 5 - LLM Reasoning (Claude AI)

> **Where:** `src/api/llm_explainer.py`

This module turns raw numbers into **human-readable manager advice** using Anthropic Claude 3.5 Sonnet.

---

### How It Works

**Input sent to Claude:**
```
Item: Premium Olive Oil (Condiments)
Current Stock on Hand: 12 units
Predicted 7-Day Demand: 47.0 units
Recommended Reorder Quantity: 43 units
Estimated Days until Stockout: 1.8 days
Forecasting Model: XGBoost

Write a single concise sentence explaining why the store manager
should make this restock decision...
```

**Output from Claude:**
```
"Urgent reorder of 43 units required — current stock (12 units) will
exhaust in 1.8 days at current demand velocity of 6.7 units/day."
```

---

### Smart Caching

Claude API calls cost money and take time. Every explanation is **cached using an MD5 hash** of the input parameters. If the same stock/demand combination appears again, the cached answer is returned instantly — no API call needed.

```
Cache Key = MD5(item_name + current_stock + demand_7d + reorder_qty + stockout_days)
```

---

### Offline Fallback (No API Key Required)

If no Claude API key is configured, the system uses a **built-in heuristic generator** automatically:

```
if stockout_days <= 1.5:
    "Urgent reorder of N units required — will exhaust in X days..."

elif stockout_days <= 3.5:
    "Reorder N units to prevent weekend stockout..."

elif recommended_reorder > 0:
    "Recommend restocking N units to maintain 7-day safety buffer..."

else:
    "Stock levels are optimal (N units on hand) — no reorder needed."
```

This means RestockAI works **fully offline** without any Claude API key.

---

## 9. Step 6 - Google Sheets Export

> **Where:** `src/frontend/sheets_exporter.py`

Allows managers to **push restock orders directly into a Google Sheets spreadsheet** with one click.

### How It Works

1. Gets current recommendations for the store via internal API call
2. **If Google credentials are configured** (`GOOGLE_SHEETS_CREDENTIALS_JSON` in `.env`):
   - Uses `gspread` library to authenticate with Google Sheets API
   - Creates or opens a spreadsheet named after the store
   - Writes all restock recommendations as rows
   - Returns the shareable spreadsheet URL
3. **If no Google credentials are configured:**
   - Falls back to CSV: saves `data/exports/restock_{store_id}_{date}.csv`
   - Returns a download URL for the CSV file

---

## 10. Step 7 - React Frontend Dashboard

> **Where:** `frontend/src/`

The web interface is a **React 18 Single Page Application** (SPA) built with Vite.

---

### `frontend/src/App.jsx` - The Entire UI

**Dashboard Sections:**

**1. Header Bar**
- RestockAI logo
- Store selector dropdown (all 50 stores)
- Last data refresh timestamp

**2. Summary Cards Row**
- Total items tracked
- Critical items count (need immediate reorder)
- Total recommended reorder units
- Estimated reorder investment in dollars

**3. Filters Bar**
- Filter by urgency: All / Critical / Moderate / Healthy
- Filter by product category

**4. Recommendations Table**
Each row shows:
- Item name and category badge
- Current stock on hand
- 7-day demand forecast
- Urgency badge (color-coded: Red / Yellow / Green)
- Recommended reorder quantity with `-` / `+` stepper for adjustments
- Expand button to open the item detail drawer

**5. Item Detail Drawer (Side Panel)**
Opens when you click an item:
- 7-day and 30-day demand forecasts with numbers
- Confidence interval range (lower and upper bounds)
- Stockout risk timeline in days
- Unit cost and current selling price
- Profit margin calculation
- Which ML model was used (Prophet or XGBoost)
- Claude AI rationale explanation text

**6. Export Button**
"Push to Google Sheets" button that calls `/api/v1/export/sheets/{store_id}`

---

### `frontend/src/index.css` - Design System

Defines the entire visual language of the app:
- **Color palette:** Deep navy background, clean white cards, red/yellow/green for urgency
- **Typography:** Modern font stack (Inter)
- **Component classes:** `.badge-critical`, `.card`, `.drawer`, `.btn-primary`, etc.
- **Animations:** Smooth drawer slide-in, hover effects, loading states

---

### `frontend/vite.config.js` - Build Configuration

- Dev server runs on **port 5173**
- Proxies `/api` requests to **FastAPI on port 8000** (avoids CORS issues in development)
- Builds optimized production bundle to `frontend/dist/` (served directly by FastAPI in production)

---

## 11. Step 8 - Tests

> **Where:** `tests/`

RestockAI has **14 automated tests** covering every major component.

---

### `tests/test_etl.py` - ETL Tests

| Test Name | What It Checks |
|:----------|:---------------|
| `test_store_validation` | Valid stores pass; stores with missing fields are quarantined |
| `test_item_validation` | Valid items pass; items with negative costs are rejected |
| `test_sales_daily_validation` | Valid sales pass; negative units_sold rows are quarantined |
| `test_synthetic_data_generation_and_etl` | Full end-to-end: generate data -> run ETL -> verify DB counts |

---

### `tests/test_ml_forecasting.py` - ML Tests

| Test Name | What It Checks |
|:----------|:---------------|
| `test_feature_engineering` | FeatureEngineer creates all expected lag and rolling columns |
| `test_xgboost_forecaster` | XGBoost trains on sample data and returns 30-day predictions |
| `test_prophet_forecaster` | Prophet trains and returns predictions with confidence bounds |
| `test_model_evaluator` | Evaluator runs both models, compares MAPE, returns the winner |
| `test_forecast_pipeline_db_write` | Full pipeline runs and forecasts appear in the test database |

---

### `tests/test_api.py` - API Tests

| Test Name | What It Checks |
|:----------|:---------------|
| `test_health_check_endpoint` | `/api/v1/health` returns `status: healthy` |
| `test_list_stores_endpoint` | `/api/v1/stores` returns list of stores |
| `test_store_recommendations_endpoint` | `/api/v1/recommendations/{store_id}` returns valid recommendations |
| `test_item_detail_endpoint` | `/api/v1/recommendations/{store_id}/{item_id}` returns correct item detail |
| `test_sheets_export_endpoint` | `/api/v1/export/sheets/{store_id}` returns export status |

**Run all tests:**
```bash
pytest tests/ -v
```

**Expected output:**
```
tests/test_api.py::test_health_check_endpoint PASSED             [  7%]
tests/test_api.py::test_list_stores_endpoint PASSED              [ 14%]
tests/test_api.py::test_store_recommendations_endpoint PASSED    [ 21%]
tests/test_api.py::test_item_detail_endpoint PASSED              [ 28%]
tests/test_api.py::test_sheets_export_endpoint PASSED            [ 35%]
tests/test_etl.py::test_store_validation PASSED                  [ 42%]
tests/test_etl.py::test_item_validation PASSED                   [ 50%]
tests/test_etl.py::test_sales_daily_validation PASSED            [ 57%]
tests/test_etl.py::test_synthetic_data_generation_and_etl PASSED [ 64%]
tests/test_ml_forecasting.py::test_feature_engineering PASSED    [ 71%]
tests/test_ml_forecasting.py::test_xgboost_forecaster PASSED     [ 78%]
tests/test_ml_forecasting.py::test_prophet_forecaster PASSED     [ 85%]
tests/test_ml_forecasting.py::test_model_evaluator PASSED        [ 92%]
tests/test_ml_forecasting.py::test_forecast_pipeline_db_write PASSED [100%]
14 passed in 7.19s
```

---

## 12. Step 9 - DevOps and Docker

> **Where:** `docker/`, `docker-compose.yml`, `.github/`

---

### `docker-compose.yml` - Run All Services Together

Defines 3 services that run together:

| Service | Container | Role |
|:--------|:----------|:-----|
| `db` | PostgreSQL 16 | Production database |
| `api` | FastAPI + Uvicorn | Backend API server (port 8000) |
| `scheduler` | Python scheduler | Runs weekly ML retraining |

```bash
docker-compose up --build
```

---

### `docker/Dockerfile.api` - API Container

- Base image: Python 3.11 slim
- Installs all requirements from `requirements.txt`
- Copies `src/` and the built `frontend/dist/`
- Runs: `python -m src.api.main`

---

### `docker/Dockerfile.ml` - ML Training Container

- Runs the forecast pipeline on startup
- Then idles and waits for scheduled triggers

---

### `docker/Dockerfile.etl` - ETL Container

- Runs the ETL pipeline once on startup to load initial data

---

### `.github/workflows/ci-cd.yml` - GitHub Actions CI/CD

Automatically runs on every `git push`:

1. Install Python dependencies
2. Run all 14 pytest tests
3. Build Docker images if all tests pass
4. (Optional) Deploy to cloud if configured

---

## 13. Data Flow: End-to-End Journey

Here's the exact path data takes from raw CSV to a manager's restock decision:

```
STEP 1 - DATA ENTRY
  Synthetic data generator creates 1 year of POS sales history
  -> Saves to data/raw/stores.csv, items.csv, sales_2024.csv

STEP 2 - ETL PIPELINE
  Reads CSVs -> Validates each row -> Quarantines bad rows
  -> Bulk upserts valid rows into sales_daily table in DB

STEP 3 - ML TRAINING (manual or weekly scheduler)
  For each store-item pair (e.g., Store-01 x Olive Oil):
    Feature engineering creates lag/rolling/calendar features
    Prophet trains -> backtested MAPE = 12.3%
    XGBoost trains -> backtested MAPE = 9.8%  <- WINNER
    XGBoost predicts 30 days ahead
    -> Saves forecast rows to forecasts table in DB

STEP 4 - API REQUEST (manager opens dashboard)
  GET /api/v1/recommendations/STORE-01
    Fetches current stock from sales_daily
    Fetches 7-day and 30-day forecasts from forecasts table
    Calculates: daily_run_rate = 47 / 7 = 6.7 units/day
    Calculates: stockout_days = 12 / 6.7 = 1.8 days  <- CRITICAL!
    Calculates: safety_stock = 6.7 x 2.5 = 17 units
    Calculates: reorder = 47 + 17 - 12 = 52 units
    Calls Claude AI -> generates plain-English explanation

STEP 5 - FRONTEND RENDERS
  Dashboard shows red CRITICAL badge on Olive Oil
  -> "Reorder 52 units - stockout in 1.8 days"
  -> Manager adjusts quantity with +/- stepper
  -> Clicks "Push to Google Sheets"

STEP 6 - EXPORT
  POST /api/v1/export/sheets/STORE-01
  -> Google Sheets populated with all restock orders
  -> Manager downloads or shares with procurement team
```

---

## 14. How to Run the Project

### Option A: Full Local Setup (Recommended for first time)

```bash
# 1. Clone the project
git clone <your-repo-url>
cd RestockAI

# 2. Create virtual environment
python -m venv venv

# Activate on Windows:
.\venv\Scripts\activate

# Activate on Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
copy .env.example .env          # Windows
cp .env.example .env            # Mac/Linux
# (Optionally add ANTHROPIC_API_KEY inside .env)

# 5. Generate synthetic data
python -m src.data_pipeline.generate_synthetic_data

# 6. Run ETL pipeline (loads data into database)
python -m src.data_pipeline.etl

# 7. Train ML models and generate forecasts
python -m src.ml_engine.forecast_pipeline

# 8. Start the backend server
python -m src.api.main
# Open http://localhost:8000
```

---

### Option B: Frontend Hot-Reload (Development mode)

```bash
# Terminal 1 - Start FastAPI backend
python -m src.api.main

# Terminal 2 - Start Vite frontend dev server
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

### Option C: Docker (Production-like environment)

```bash
docker-compose up --build
# Open http://localhost:8000
```

---

## 15. Environment Variables Reference

> Copy `.env.example` to `.env` and fill in values.

| Variable | Default Value | Required? | Description |
|:---------|:-------------|:----------|:------------|
| `ENVIRONMENT` | `development` | No | Set to `production` in prod |
| `LOG_LEVEL` | `INFO` | No | `DEBUG`, `INFO`, `WARNING`, or `ERROR` |
| `DATABASE_URL` | `sqlite:///data/restockai.db` | No | SQLite for local dev; PostgreSQL URL for production |
| `ANTHROPIC_API_KEY` | *(empty)* | Optional | Claude 3.5 Sonnet API key. Heuristic fallback is used if missing. |
| `LLM_MODEL` | `claude-3-5-sonnet-20241022` | No | Anthropic model name to use |
| `LLM_CACHE_ENABLED` | `true` | No | Enable or disable LLM response memory caching |
| `GOOGLE_SHEETS_CREDENTIALS_JSON` | *(empty)* | Optional | Path to Google service account JSON. CSV export used as fallback if missing. |

> **You can run the entire project without any API keys.** The Claude fallback generates heuristic explanations automatically, and Google Sheets export falls back to downloadable CSV.

---

*Built with Python, FastAPI, React, Prophet, XGBoost, and Claude 3.5 Sonnet.*
