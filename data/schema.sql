-- ==========================================================
-- RestockAI Portable Database Schema (PostgreSQL & BigQuery)
-- ==========================================================

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    store_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    item_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily sales & inventory table
CREATE TABLE IF NOT EXISTS sales_daily (
    store_id VARCHAR(64) NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    units_sold INT NOT NULL,
    stock_on_hand INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, item_id, date),
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_sales_daily_date ON sales_daily(date);
CREATE INDEX IF NOT EXISTS idx_sales_daily_store_item ON sales_daily(store_id, item_id);

-- Forecasts table (Used in Phase 2)
CREATE TABLE IF NOT EXISTS forecasts (
    forecast_id VARCHAR(64) PRIMARY KEY,
    store_id VARCHAR(64) NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    forecast_date DATE NOT NULL,
    horizon_days INT NOT NULL,
    predicted_demand NUMERIC(10, 2) NOT NULL,
    lower_bound NUMERIC(10, 2) NOT NULL,
    upper_bound NUMERIC(10, 2) NOT NULL,
    model_used VARCHAR(64) NOT NULL,
    model_mape NUMERIC(8, 4),
    model_rmse NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_forecasts_lookup ON forecasts(store_id, item_id, forecast_date);

-- System Logs table (Used in Phase 5)
CREATE TABLE IF NOT EXISTS system_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(64) NOT NULL,
    component VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    details TEXT,
    execution_time_ms INT
);

-- ==========================================================
-- Multi-User Platform Tables (Auth, User Data, Predictions)
-- ==========================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User Data table
CREATE TABLE IF NOT EXISTS user_data (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(255),
    input_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    input_data TEXT NOT NULL,
    prediction NUMERIC(10, 2) NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    lower_bound NUMERIC(10, 2),
    upper_bound NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);

-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
