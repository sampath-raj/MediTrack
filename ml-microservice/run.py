import uvicorn
import os
from pathlib import Path

# Check if model exists, if not, train it
model_path = Path("app/models/trained_model.pkl")
if not model_path.exists():
    print("Training model for first-time use...")
    from app.training.train_model import train_model
    train_model()

# Run the FastAPI application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting MediTrack ML Microservice on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)