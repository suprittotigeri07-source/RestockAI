# RestockAI: Complete 5-Phase Project Walkthrough

**RestockAI** is a production-ready retail inventory demand forecasting and automated restock recommendation system built for store managers.

---

## Live Application & URLs

- **Live Web Dashboard (React SPA)**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI / Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 5-Phase Delivery Summary

### Phase 1 — Data Foundation
- **Portable Relational Schema**: [data/schema.sql](file:///d:/Projects/RestockAI/data/schema.sql) (PostgreSQL & BigQuery compatible ANSI SQL) and ORM models in [src/database/models.py](file:///d:/Projects/RestockAI/src/database/models.py).
- **Realistic Synthetic Dataset Generator**: [src/data_pipeline/generate_synthetic_data.py](file:///d:/Projects/RestockAI/src/data_pipeline/generate_synthetic_data.py) generating 50 stores across 5 regions, 200 items across 8 retail categories, with holiday surges, seasonality curves, promotional pricing, and stockout cycles.
- **Error-Isolating ETL Pipeline**: [src/data_pipeline/etl.py](file:///d:/Projects/RestockAI/src/data_pipeline/etl.py) with row validation in [src/data_pipeline/schema_validator.py](file:///d:/Projects/RestockAI/src/data_pipeline/schema_validator.py) which quarantines bad rows without crashing and performs bulk upserts.

### Phase 2 — ML Demand Forecasting Engine
- **Time-Series Feature Engineering**: [src/ml_engine/features.py](file:///d:/Projects/RestockAI/src/ml_engine/features.py) computing calendar cycles, multi-horizon lags (1d, 2d, 7d, 14d, 21d, 28d), and rolling statistics (7d, 14d, 30d).
- **Dual Forecasters**:
  - [src/ml_engine/prophet_model.py](file:///d:/Projects/RestockAI/src/ml_engine/prophet_model.py): Facebook Prophet modeling annual seasonality and weekly spikes with statsmodels Holt-Winters fallback.
  - [src/ml_engine/xgboost_model.py](file:///d:/Projects/RestockAI/src/ml_engine/xgboost_model.py): XGBoost Regressor modeling autoregressive nonlinear patterns.
- **Model Evaluator**: [src/ml_engine/evaluator.py](file:///d:/Projects/RestockAI/src/ml_engine/evaluator.py) comparing backtested MAPE & RMSE to pick the winning model per category.
- **Retraining Scheduler**: [src/ml_engine/retrain_scheduler.py](file:///d:/Projects/RestockAI/src/ml_engine/retrain_scheduler.py) for scheduled weekly model updates.

### Phase 3 — Serving Layer & LLM Reasoning
- **FastAPI Backend**: [src/api/routes.py](file:///d:/Projects/RestockAI/src/api/routes.py) & [src/api/main.py](file:///d:/Projects/RestockAI/src/api/main.py) with SlowAPI rate limiting, Pydantic v2 schemas, and CORS.
- **Claude LLM Reasoning Layer**: [src/api/llm_explainer.py](file:///d:/Projects/RestockAI/src/api/llm_explainer.py) calling Anthropic Claude 3.5 Sonnet to turn raw demand numbers into actionable 1-2 sentence store manager advice, with local LRU caching.
- **Google Sheets Exporter**: [src/frontend/sheets_exporter.py](file:///d:/Projects/RestockAI/src/frontend/sheets_exporter.py) supporting 1-click export via `gspread` with downloadable CSV fallback.

### Phase 4 — Human-Designed React Frontend
- **React 18 + Vite**: Built in [frontend/src/App.jsx](file:///d:/Projects/RestockAI/frontend/src/App.jsx) and styled with clean enterprise CSS in [frontend/src/index.css](file:///d:/Projects/RestockAI/frontend/src/index.css).
- **Store Switcher & Real-Time Sync**: Instant filtering across all 50 stores.
- **Tactile UI Controls**:
  - Urgent priority badges (Critical / Moderate / Healthy).
  - Inline manager quantity stepper (`-` / `+`).
  - Item detail drawer breaking down confidence intervals, unit economics, and margins.
  - One-click "Push to Google Sheets" action.

### Phase 5 — Production Hardening & CI/CD
- **Containerization**: [docker-compose.yml](file:///d:/Projects/RestockAI/docker-compose.yml) orchestrating PostgreSQL 16, FastAPI backend, and ML scheduler.
- **Multi-Stage Dockerfiles**: [docker/Dockerfile.api](file:///d:/Projects/RestockAI/docker/Dockerfile.api), [docker/Dockerfile.ml](file:///d:/Projects/RestockAI/docker/Dockerfile.ml), [docker/Dockerfile.etl](file:///d:/Projects/RestockAI/docker/Dockerfile.etl).
- **CI/CD Pipeline**: [.github/workflows/ci-cd.yml](file:///d:/Projects/RestockAI/.github/workflows/ci-cd.yml) running automated pytest tests and building Docker containers on GitHub Actions.
- **Environment & Documentation**: [.env.example](file:///d:/Projects/RestockAI/.env.example) and [README.md](file:///d:/Projects/RestockAI/README.md).

---

## Test Suite Execution Results

```bash
pytest tests/ -v
```

```
============================= test session starts =============================
tests/test_api.py::test_health_check_endpoint PASSED                     [  7%]
tests/test_api.py::test_list_stores_endpoint PASSED                      [ 14%]
tests/test_api.py::test_store_recommendations_endpoint PASSED            [ 21%]
tests/test_api.py::test_item_detail_endpoint PASSED                      [ 28%]
tests/test_api.py::test_sheets_export_endpoint PASSED                    [ 35%]
tests/test_etl.py::test_store_validation PASSED                          [ 42%]
tests/test_etl.py::test_item_validation PASSED                           [ 50%]
tests/test_etl.py::test_sales_daily_validation PASSED                    [ 57%]
tests/test_etl.py::test_synthetic_data_generation_and_etl PASSED         [ 64%]
tests/test_ml_forecasting.py::test_feature_engineering PASSED            [ 71%]
tests/test_ml_forecasting.py::test_xgboost_forecaster PASSED             [ 78%]
tests/test_ml_forecasting.py::test_prophet_forecaster PASSED             [ 85%]
tests/test_ml_forecasting.py::test_model_evaluator PASSED                [ 92%]
tests/test_ml_forecasting.py::test_forecast_pipeline_db_write PASSED     [100%]
============================= 14 passed in 7.19s ==============================
```
