from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import pickle
import numpy as np
from pathlib import Path

# Import local modules
from app.models.prediction import PredictionInput, PredictionResult, CategoryPrediction
from app.utils.data_processor import preprocess_input

# Initialize FastAPI app
app = FastAPI(
    title="MediTrack Demand Prediction API",
    description="API for predicting medicine category demand based on climate and seasonal data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Load the trained model
MODEL_PATH = Path("app/models/trained_model.pkl")

def load_model():
    try:
        if MODEL_PATH.exists():
            with open(MODEL_PATH, "rb") as f:
                return pickle.load(f)
        else:
            # If model doesn't exist, train it
            from app.training.train_model import train_model
            model = train_model()
            return model
    except Exception as e:
        print(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail="Failed to load prediction model")

# Load model on startup
model = load_model()

@app.get("/")
async def root():
    return {"message": "Welcome to MediTrack Demand Prediction API"}

@app.post("/predict-demand", response_model=PredictionResult)
async def predict_demand(input_data: PredictionInput):
    try:
        # Preprocess the input data
        features = preprocess_input(input_data)
        
        # Make predictions for each medicine category
        categories = ["Antihistamines", "ColdRelief", "Painkillers"]
        predictions = []
        
        for category in categories:
            # Add category as a feature
            category_features = np.append(features, [categories.index(category)])
            
            # Predict demand level
            prediction = model.predict([category_features])[0]
            probability = max(model.predict_proba([category_features])[0])
            
            # Map numerical prediction to demand level
            demand_levels = ["Low", "Moderate", "High"]
            demand_level = demand_levels[prediction]
            
            predictions.append(
                CategoryPrediction(
                    category=category,
                    demand_level=demand_level,
                    confidence=float(probability)
                )
            )
        
        return PredictionResult(predictions=predictions)
    
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)