import numpy as np
from app.models.prediction import PredictionInput

# Define region encoding
REGION_MAPPING = {
    "northeast": 0,
    "southeast": 1,
    "midwest": 2,
    "southwest": 3,
    "west": 4,
    # Add more regions as needed
    # Default for unknown regions
    "other": 5
}

def preprocess_input(input_data: PredictionInput) -> np.ndarray:
    """
    Preprocess the input data for model prediction
    
    Args:
        input_data: The input data containing region, month, temperature, and humidity
        
    Returns:
        numpy array of processed features ready for model prediction
    """
    # Extract features
    region = input_data.region.lower()
    month = input_data.month
    avg_temp = input_data.avg_temp
    humidity = input_data.humidity
    
    # Encode region
    region_encoded = REGION_MAPPING.get(region, REGION_MAPPING["other"])
    
    # Derive season from month
    # 1-3: Winter, 4-6: Spring, 7-9: Summer, 10-12: Fall
    season_mapping = {1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3}
    season = season_mapping[month]
    
    # Create feature array
    features = np.array([region_encoded, month, season, avg_temp, humidity])
    
    return features

def get_season_name(month: int) -> str:
    """
    Get season name from month number
    
    Args:
        month: Month number (1-12)
        
    Returns:
        Season name (Winter, Spring, Summer, Fall)
    """
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Spring"
    elif month in [6, 7, 8]:
        return "Summer"
    else:  # 9, 10, 11
        return "Fall"