import os
import hashlib
from typing import Dict, Any, Optional
from functools import lru_cache
from src.utils.config import settings
from src.utils.logger import logger

class LLMExplainer:
    """
    Reasoning layer turning demand forecasts and inventory telemetry
    into clear, actionable plain-English restock recommendations.
    Employs Anthropic Claude 3.5 Sonnet with local LRU & persistent caching.
    """
    
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY or os.environ.get("ANTHROPIC_API_KEY", "")
        self.client = None
        self._memory_cache: Dict[str, str] = {}
        
        if self.api_key and self.api_key.strip() != "":
            try:
                import anthropic
                self.client = anthropic.Anthropic(api_key=self.api_key)
                logger.info("Anthropic Claude client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Anthropic client: {e}")
                
    def generate_explanation(
        self,
        item_name: str,
        category: str,
        current_stock: int,
        predicted_demand_7d: float,
        recommended_reorder: int,
        stockout_days: float,
        model_used: str,
        unit_cost: float
    ) -> str:
        """
        Generates a concise 1-2 sentence human restock explanation.
        """
        cache_key = self._build_cache_key(
            item_name, current_stock, predicted_demand_7d, recommended_reorder, stockout_days
        )
        
        # Check cache
        if settings.LLM_CACHE_ENABLED and cache_key in self._memory_cache:
            return self._memory_cache[cache_key]
            
        # If Claude API is available, call Anthropic
        if self.client:
            try:
                prompt = (
                    f"You are RestockAI, an expert retail inventory advisor for a store manager.\n"
                    f"Item: {item_name} ({category})\n"
                    f"Current Stock on Hand: {current_stock} units\n"
                    f"Predicted 7-Day Demand: {predicted_demand_7d:.1f} units\n"
                    f"Recommended Reorder Quantity: {recommended_reorder} units\n"
                    f"Estimated Days until Stockout: {stockout_days:.1f} days\n"
                    f"Forecasting Model: {model_used}\n\n"
                    f"Write a single concise, punchy sentence explaining exactly why the store manager should make this restock decision. "
                    f"Highlight the urgency, demand change, and stockout timeline. No markdown fluff or introductory phrases."
                )
                
                response = self.client.messages.create(
                    model=settings.LLM_MODEL,
                    max_tokens=100,
                    temperature=0.3,
                    messages=[{"role": "user", "content": prompt}]
                )
                explanation = response.content[0].text.strip()
                self._memory_cache[cache_key] = explanation
                return explanation
            except Exception as e:
                logger.warning(f"Anthropic API call failed ({e}), falling back to heuristic explanation.")
                
        # Heuristic explanation generator (offline / fallback mode)
        explanation = self._heuristic_explanation(
            item_name, category, current_stock, predicted_demand_7d, recommended_reorder, stockout_days, unit_cost
        )
        self._memory_cache[cache_key] = explanation
        return explanation

    def _heuristic_explanation(
        self,
        item_name: str,
        category: str,
        current_stock: int,
        predicted_demand_7d: float,
        recommended_reorder: int,
        stockout_days: float,
        unit_cost: float
    ) -> str:
        daily_velocity = predicted_demand_7d / 7.0 if predicted_demand_7d > 0 else 1.0
        
        if stockout_days <= 1.5:
            return (
                f"Urgent reorder of {recommended_reorder} units required — current stock ({current_stock} units) "
                f"will exhaust in {stockout_days:.1f} days at current demand velocity of {daily_velocity:.1f} units/day."
            )
        elif stockout_days <= 3.5:
            return (
                f"Reorder {recommended_reorder} units to prevent weekend stockout — 7-day projected demand is {predicted_demand_7d:.0f} units "
                f"with only {stockout_days:.1f} days of inventory remaining."
            )
        elif recommended_reorder > 0:
            return (
                f"Recommend restocking {recommended_reorder} units to maintain 7-day safety buffer against {category} demand fluctuations."
            )
        else:
            return (
                f"Stock levels are optimal ({current_stock} units on hand covering {stockout_days:.1f} days of demand) — no reorder needed."
            )

    @staticmethod
    def _build_cache_key(
        item_name: str,
        current_stock: int,
        demand: float,
        reorder: int,
        stockout: float
    ) -> str:
        raw = f"{item_name}_{current_stock}_{round(demand, 1)}_{reorder}_{round(stockout, 1)}"
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

llm_explainer = LLMExplainer()
