from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class PredictionInput(BaseModel):
    """Input model for demand prediction"""
    region: str = Field(..., description="Geographic region (e.g., northeast, southwest)")
    month: int = Field(..., ge=1, le=12, description="Month of the year (1-12)")
    avg_temp: float = Field(..., description="Average temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity percentage")

class CategoryPrediction(BaseModel):
    """Prediction result for a single medicine category"""
    category: str = Field(..., description="Medicine category name")
    demand_level: Literal["Low", "Moderate", "High"] = Field(..., description="Predicted demand level")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score of the prediction")

class PredictionResult(BaseModel):
    """Overall prediction result containing predictions for all categories"""
    predictions: List[CategoryPrediction] = Field(..., description="List of category predictions")