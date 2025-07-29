# ML Microservice Integration

This document describes the integration between the MediTrack Node.js backend and the ML microservice for medicine demand prediction.

## Overview

The integration allows the MediTrack application to send climate and seasonal data to the ML microservice and receive demand predictions for different medicine categories.

## Implementation Details

### Backend Integration

1. **Route File**: `routes/mlIntegration.js`
   - Handles requests from the frontend
   - Forwards data to the ML microservice
   - Returns prediction results

2. **Server Configuration**: Updated `server.js` to include the new route
   - Added route at `/api/recommendation`

3. **API Endpoint**:
   - **URL**: `/api/recommendation`
   - **Method**: POST
   - **Authentication**: Protected (requires valid JWT token)
   - **Request Body**:
     ```json
     {
       "region": "northeast",
       "month": 7,
       "avg_temp": 28.5,
       "humidity": 65
     }
     ```
   - **Response**:
     ```json
     {
       "success": true,
       "data": {
         "predictions": [
           {
             "category": "Antihistamines",
             "demand_level": "High",
             "confidence": 0.92
           },
           {
             "category": "ColdRelief",
             "demand_level": "Moderate",
             "confidence": 0.85
           },
           {
             "category": "Painkillers",
             "demand_level": "Low",
             "confidence": 0.78
           }
         ]
       }
     }
     ```

### Frontend Integration

A sample React component (`MedicinePrediction.jsx`) has been created to demonstrate how to call the API endpoint from the frontend.

## Configuration

The ML microservice URL is configured using an environment variable:

```
ML_SERVICE_URL=http://your-ml-service-url:8000
```

If not specified, it defaults to `http://localhost:8000`.

## Security Best Practices

### 1. API Key Authentication

Implement API key authentication between the services:

```javascript
// In mlIntegration.js
const ML_API_KEY = process.env.ML_API_KEY;

// Add to axios request
const response = await axios.post(`${ML_SERVICE_URL}/predict-demand`, data, {
  headers: {
    'X-API-Key': ML_API_KEY
  }
});
```

```python
# In FastAPI main.py
from fastapi import Security, Depends, HTTPException
from fastapi.security.api_key import APIKeyHeader

API_KEY = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key")

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == API_KEY:
        return api_key
    raise HTTPException(status_code=403, detail="Invalid API Key")

@app.post("/predict-demand", response_model=PredictionResult)
async def predict_demand(input_data: PredictionInput, api_key: str = Depends(get_api_key)):
    # Existing code...
```

### 2. HTTPS Communication

Ensure all communication between services uses HTTPS in production.

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// Using express-rate-limit package
const rateLimit = require('express-rate-limit');

const mlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests to ML service, please try again later'
});

router.post('/', mlLimiter, getMedicineDemandPrediction);
```

### 4. Input Validation

The current implementation includes basic input validation. Consider using a validation library like Joi for more robust validation.

### 5. Error Handling

The implementation includes comprehensive error handling for different scenarios.

## Deployment Considerations

1. **Service Discovery**: In a production environment, consider using service discovery mechanisms.

2. **Health Checks**: Implement health checks for the ML service to ensure it's available.

3. **Circuit Breaker**: Implement a circuit breaker pattern to handle ML service outages gracefully.

4. **Monitoring**: Add monitoring and alerting for the integration points.