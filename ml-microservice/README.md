# MediTrack ML Microservice

This microservice predicts medicine category demand based on climate and seasonal data. It's built with FastAPI and uses machine learning to provide demand predictions for different medicine categories.

## Features

- Predicts demand levels (Low, Moderate, High) for medicine categories
- Uses climate and seasonal data as input parameters
- Exposes a REST API with CORS support
- Built with FastAPI for high performance

## API Endpoints

### POST /predict-demand

Predicts demand levels for medicine categories based on provided parameters.

**Request Body:**

```json
{
  "region": "northeast",
  "month": 6,
  "avg_temp": 28.5,
  "humidity": 65
}
```

**Response:**

```json
{
  "predictions": [
    {
      "category": "Antihistamines",
      "demand_level": "High",
      "confidence": 0.85
    },
    {
      "category": "ColdRelief",
      "demand_level": "Low",
      "confidence": 0.78
    },
    {
      "category": "Painkillers",
      "demand_level": "Moderate",
      "confidence": 0.72
    }
  ]
}
```

## Setup and Installation

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `uvicorn app.main:app --reload`

## Integration with Node.js Backend

This microservice is designed to be consumed by the main MediTrack Node.js backend. See the example client code in `client_example.js` for how to make requests to this service.