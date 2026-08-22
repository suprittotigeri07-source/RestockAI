import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from pathlib import Path
from typing import Optional
from src.utils.logger import logger

REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West"]

CATEGORIES = {
    "Beverages": {
        "items": ["Organic Green Tea", "Cold Brew Coffee", "Sparkling Water 12pk", "Almond Milk 64oz", "Fresh Orange Juice", "Energy Drink 4pk", "Kombucha Ginger", "Oat Milk Barista"],
        "cost_range": (1.20, 6.50),
        "margin": 0.35,
        "base_vol": 35,
        "weekend_mult": 1.25,
        "summer_mult": 1.40
    },
    "Dairy": {
        "items": ["Whole Milk 1Gal", "Greek Yogurt 32oz", "Cheddar Cheese Block", "Unsalted Butter 1lb", "Sour Cream 16oz", "Cottage Cheese", "Eggs Large Grade A 12ct", "Mozzarella Shredded"],
        "cost_range": (1.80, 5.20),
        "margin": 0.28,
        "base_vol": 45,
        "weekend_mult": 1.30,
        "summer_mult": 0.95
    },
    "Bakery": {
        "items": ["Artisan Sourdough", "Whole Wheat Bread", "Brioche Buns 6pk", "Blueberry Muffins 4pk", "Butter Croissants 4pk", "Bagels Plain 6pk", "Chocolate Chip Cookies", "Cinnamon Rolls"],
        "cost_range": (1.50, 4.80),
        "margin": 0.45,
        "base_vol": 28,
        "weekend_mult": 1.45,
        "summer_mult": 0.90
    },
    "Produce": {
        "items": ["Organic Bananas 2lb", "Avocados Hass 4pk", "Honeycrisp Apples 3lb", "Baby Spinach 16oz", "Roma Tomatoes 2lb", "English Cucumbers", "Yellow Onions 3lb", "Russet Potatoes 5lb"],
        "cost_range": (0.90, 4.20),
        "margin": 0.40,
        "base_vol": 55,
        "weekend_mult": 1.35,
        "summer_mult": 1.20
    },
    "Meat & Seafood": {
        "items": ["Boneless Chicken Breast 2lb", "Ground Beef 85/15 1lb", "Atlantic Salmon Fillet 1lb", "Pork Chops Bone-In 2lb", "Thick Cut Bacon 16oz", "Ground Turkey 93/7 1lb", "Jumbo Shrimp 1lb", "Italian Sausage 1lb"],
        "cost_range": (3.50, 14.00),
        "margin": 0.30,
        "base_vol": 22,
        "weekend_mult": 1.50,
        "summer_mult": 1.30
    },
    "Snacks": {
        "items": ["Tortilla Chips Sea Salt", "Mixed Nuts Roasted 16oz", "Dark Chocolate Bar 70%", "Pretzels Crispy 16oz", "Granola Bars Honey Oats", "Gourmet Popcorn Cheddar", "Pita Chips Garlic", "Trail Mix Mountain Blend"],
        "cost_range": (1.40, 5.50),
        "margin": 0.38,
        "base_vol": 32,
        "weekend_mult": 1.40,
        "summer_mult": 1.15
    },
    "Frozen": {
        "items": ["Frozen Thin Crust Pizza", "Ice Cream Vanilla Bean 48oz", "Frozen Berries Blend 24oz", "Waffles Homestyle 10ct", "Frozen Vegetables Stir Fry", "Burritos Bean & Cheese 4pk", "Chicken Nuggets 24oz", "Frozen Dumplings Pork"],
        "cost_range": (2.20, 7.80),
        "margin": 0.32,
        "base_vol": 30,
        "weekend_mult": 1.30,
        "summer_mult": 1.25
    },
    "Household": {
        "items": ["Paper Towels 6 Rolls", "Toilet Paper 12 Mega Rolls", "Liquid Laundry Detergent 64 loads", "Dish Soap 24oz", "Disinfecting Wipes 75ct", "Trash Bags 13Gal 45ct", "Sponges Multi-Pack 6ct", "Foil Wrap Heavy Duty 75ft"],
        "cost_range": (2.50, 12.00),
        "margin": 0.30,
        "base_vol": 18,
        "weekend_mult": 1.20,
        "summer_mult": 1.00
    }
}

def generate_synthetic_data(
    num_stores: int = 50,
    num_items: int = 200,
    days: Optional[int] = None,
    years: Optional[float] = None,
    output_dir: str = "data/raw",
    seed: int = 42
):
    """
    High performance vectorized synthetic data generator for multi-store retail.
    """
    if years is not None:
        days = max(1, int(years * 365))
    elif days is None:
        days = 730
        
    np.random.seed(seed)
    random.seed(seed)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Generating synthetic dataset: {num_stores} stores, {num_items} items, {days} days...")
    
    # 1. Generate Stores
    stores_data = []
    for s_idx in range(1, num_stores + 1):
        store_id = f"STR_{s_idx:03d}"
        region = REGIONS[(s_idx - 1) % len(REGIONS)]
        stores_data.append({
            "store_id": store_id,
            "name": f"RestockMart #{s_idx:03d} ({region})",
            "region": region,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        })
    df_stores = pd.DataFrame(stores_data)
    df_stores.to_csv(out_path / "stores.csv", index=False)

    # 2. Generate Items
    items_data = []
    cat_names = list(CATEGORIES.keys())
    for item_idx in range(num_items):
        cat_name = cat_names[item_idx % len(cat_names)]
        cat_info = CATEGORIES[cat_name]
        sample_names = cat_info["items"]
        
        var_num = (item_idx // len(cat_names)) + 1
        base_name = sample_names[(item_idx // len(cat_names)) % len(sample_names)]
        name_str = f"{base_name} (Var {var_num})" if var_num > 1 else base_name
        
        unit_cost = round(random.uniform(*cat_info["cost_range"]), 2)
        item_id = f"ITM_{item_idx + 1:04d}"
        items_data.append({
            "item_id": item_id,
            "name": name_str,
            "category": cat_name,
            "unit_cost": unit_cost,
            "created_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        })
    df_items = pd.DataFrame(items_data)
    df_items.to_csv(out_path / "items.csv", index=False)

    # 3. Generate Dates
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days - 1)
    dates = [start_date + timedelta(days=i) for i in range(days)]
    date_strs = [d.strftime("%Y-%m-%d") for d in dates]
    
    # Precompute date factors
    day_of_weeks = np.array([d.weekday() for d in dates])
    day_of_years = np.array([d.timetuple().tm_yday for d in dates])
    is_weekend = np.isin(day_of_weeks, [4, 5, 6]).astype(float)
    
    # Holiday multipliers
    holiday_factors = np.ones(days, dtype=float)
    for i, d in enumerate(dates):
        if (d.month == 11 and 20 <= d.day <= 28) or (d.month == 12 and 18 <= d.day <= 25):
            holiday_factors[i] = 1.55
        elif (d.month == 7 and 1 <= d.day <= 5) or (d.month == 5 and 24 <= d.day <= 31):
            holiday_factors[i] = 1.35
            
    sales_file = out_path / "sales_daily.csv"
    store_ids = [s["store_id"] for s in stores_data]
    
    total_sales_rows = 0
    with open(sales_file, "w", encoding="utf-8") as f:
        f.write("store_id,item_id,date,units_sold,stock_on_hand,price\n")
        
        for s_idx, store_id in enumerate(store_ids):
            store_traffic = random.uniform(0.85, 1.25)
            for itm in items_data:
                itm_id = itm["item_id"]
                cat_info = CATEGORIES[itm["category"]]
                base_vol = cat_info["base_vol"] * store_traffic
                unit_cost = itm["unit_cost"]
                base_price = round(unit_cost * (1.0 + cat_info["margin"]), 2)
                
                summer_rad = (day_of_years - 80) / 365.0 * 2 * np.pi
                season_mult = 1.0 + (cat_info["summer_mult"] - 1.0) * np.sin(summer_rad)
                weekend_mult = np.where(is_weekend == 1, cat_info["weekend_mult"], 1.0)
                
                expected_demand = base_vol * season_mult * weekend_mult * holiday_factors
                sales_series = np.random.poisson(np.maximum(1.0, expected_demand))
                stock_series = np.maximum(5, (expected_demand * np.random.uniform(1.8, 3.5)).astype(int))
                
                lines = []
                for d_str, sold, stock in zip(date_strs, sales_series, stock_series):
                    lines.append(f"{store_id},{itm_id},{d_str},{sold},{stock},{base_price}\n")
                f.writelines(lines)
                total_sales_rows += len(lines)
                
    logger.info(f"Synthetic dataset complete: {total_sales_rows} sales records in {sales_file}")
    df_sales_sample = pd.read_csv(sales_file, nrows=100)
    return df_stores, df_items, df_sales_sample

if __name__ == "__main__":
    generate_synthetic_data(num_stores=50, num_items=200, days=730)
