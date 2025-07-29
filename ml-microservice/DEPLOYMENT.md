# Deployment Guide for MediTrack ML Microservice

This guide provides instructions for deploying the MediTrack ML Microservice and integrating it with the main Node.js backend.

## Local Deployment

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Node.js (for the main backend)

### Steps

1. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run the microservice**

   ```bash
   python run.py
   ```

   The service will be available at `http://localhost:8000`

3. **Test the API**

   You can test the API using the Swagger UI at `http://localhost:8000/docs`

## Production Deployment

### Option 1: Docker Deployment

1. **Create a Dockerfile**

   ```dockerfile
   FROM python:3.9-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   CMD ["python", "run.py"]
   ```

2. **Build and run the Docker image**

   ```bash
   docker build -t meditrack-ml-service .
   docker run -p 8000:8000 meditrack-ml-service
   ```

### Option 2: Cloud Deployment

#### Heroku

1. **Create a Procfile**

   ```
   web: uvicorn app.main:app --host=0.0.0.0 --port=$PORT
   ```

2. **Deploy to Heroku**

   ```bash
   heroku create meditrack-ml-service
   git push heroku main
   ```

#### AWS Elastic Beanstalk

1. **Create a requirements.txt file** (already done)

2. **Deploy using the EB CLI**

   ```bash
   eb init -p python-3.8 meditrack-ml-service
   eb create meditrack-ml-environment
   ```

## Integration with Node.js Backend

### Environment Configuration

In your Node.js backend, set the ML service URL as an environment variable:

```bash
# .env file in Node.js backend
ML_SERVICE_URL=http://localhost:8000  # For local development
# ML_SERVICE_URL=https://your-deployed-service-url  # For production
```

### Making API Calls

Use the provided `client_example.js` as a reference for making API calls from your Node.js backend:

```javascript
const { predictMedicineDemand } = require('./path/to/client_example');

// In your Node.js route handler or service
async function getMedicineDemandPredictions(req, res) {
  try {
    const { region, month } = req.body;
    
    // Get climate data (could come from a weather API in a real app)
    const avgTemp = 25.5;  // Example value
    const humidity = 60;    // Example value
    
    // Call the ML microservice
    const predictions = await predictMedicineDemand({
      region,
      month,
      avg_temp: avgTemp,
      humidity
    });
    
    res.json(predictions);
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({ message: 'Failed to get predictions' });
  }
}
```

## Scaling Considerations

- For high-traffic applications, consider deploying the microservice behind a load balancer
- Use a production-grade ASGI server like Gunicorn with Uvicorn workers
- Consider caching prediction results for common input parameters

## Monitoring and Maintenance

- Set up logging to monitor API usage and errors
- Periodically retrain the model with new data if available
- Monitor system resources (CPU, memory) to ensure optimal performance

## Security Considerations

- In production, restrict CORS to only allow requests from your main backend
- Consider adding authentication for the API endpoints
- Keep dependencies updated to address security vulnerabilities