import time
import schedule
import argparse
from src.ml_engine.forecast_pipeline import ForecastPipeline
from src.utils.logger import logger

def job():
    logger.info("Executing scheduled weekly demand forecast retraining...")
    pipeline = ForecastPipeline()
    stats = pipeline.run()
    logger.info(f"Weekly retraining completed with stats: {stats}")

def main():
    parser = argparse.ArgumentParser(description="RestockAI ML Retraining Job Scheduler")
    parser.add_argument("--once", action="store_true", help="Run once immediately and exit")
    parser.add_argument("--interval-days", type=int, default=7, help="Retraining interval in days")
    args = parser.parse_args()
    
    if args.once:
        logger.info("Running single immediate retraining run...")
        job()
        return
        
    logger.info(f"Scheduler started: retraining demand models every {args.interval_days} days.")
    job() # Initial run
    
    # Schedule every Sunday at 02:00 AM
    schedule.every().sunday.at("02:00").do(job)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()
