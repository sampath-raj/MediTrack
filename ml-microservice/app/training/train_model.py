import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle
from pathlib import Path
import os

# Constants
CATEGORIES = ["Antihistamines", "ColdRelief", "Painkillers"]
REGIONS = ["northeast", "southeast", "midwest", "southwest", "west"]
DEMAND_LEVELS = [0, 1, 2]  # 0: Low, 1: Moderate, 2: High

def generate_synthetic_data(num_years=10):
    """
    Generate synthetic data for training the model
    
    Args:
        num_years: Number of years of data to generate
        
    Returns:
        DataFrame with synthetic data
    """
    print("Generating synthetic training data...")
    
    # Calculate number of samples
    num_samples = num_years * 12 * len(REGIONS) * len(CATEGORIES)
    
    # Initialize lists to store data
    data = []
    
    # Generate data for each year, month, region, and category
    for year in range(num_years):
        for month in range(1, 13):  # 1-12 months
            for region_idx, region in enumerate(REGIONS):
                for category_idx, category in enumerate(CATEGORIES):
                    # Derive season from month (0: Winter, 1: Spring, 2: Summer, 3: Fall)
                    season_mapping = {1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 
                                     7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3}
                    season = season_mapping[month]
                    
                    # Generate temperature based on season and region with some randomness
                    base_temp = {
                        0: 5,    # Winter
                        1: 15,   # Spring
                        2: 25,   # Summer
                        3: 15    # Fall
                    }[season]
                    
                    # Adjust temperature by region
                    region_temp_adjustment = {
                        "northeast": 0,
                        "southeast": 5,
                        "midwest": -2,
                        "southwest": 8,
                        "west": 3
                    }[region]
                    
                    avg_temp = base_temp + region_temp_adjustment + np.random.normal(0, 3)
                    
                    # Generate humidity based on region and season with some randomness
                    base_humidity = {
                        "northeast": 65,
                        "southeast": 75,
                        "midwest": 60,
                        "southwest": 40,
                        "west": 55
                    }[region]
                    
                    # Adjust humidity by season
                    season_humidity_adjustment = {
                        0: 5,     # Winter
                        1: 10,    # Spring
                        2: -5,    # Summer
                        3: 0      # Fall
                    }[season]
                    
                    humidity = min(100, max(0, base_humidity + season_humidity_adjustment + np.random.normal(0, 8)))
                    
                    # Determine demand level based on category, season, temperature, and humidity
                    demand_level = determine_demand_level(category, month, avg_temp, humidity)
                    
                    # Add sample to data
                    data.append({
                        "region": region_idx,
                        "month": month,
                        "season": season,
                        "avg_temp": avg_temp,
                        "humidity": humidity,
                        "category": category_idx,
                        "demand_level": demand_level
                    })
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    print(f"Generated {len(df)} synthetic data samples")
    return df

def determine_demand_level(category, month, avg_temp, humidity):
    """
    Determine demand level based on category, month, temperature, and humidity
    
    This function encodes domain knowledge about how different factors
    affect demand for different medicine categories
    """
    # Default demand level is moderate
    demand_level = 1
    
    # Antihistamines: High in spring/summer, especially with high humidity
    if category == "Antihistamines":
        # Spring and summer months
        if month in [3, 4, 5, 6, 7, 8]:
            demand_level = 2
        # High humidity increases demand
        if humidity > 70 and avg_temp > 15:
            demand_level = 2
        # Cold weather decreases demand
        if avg_temp < 10:
            demand_level = 0
    
    # Cold Relief: High in fall/winter, especially with temperature fluctuations
    elif category == "ColdRelief":
        # Fall and winter months
        if month in [10, 11, 12, 1, 2]:
            demand_level = 2
        # Low temperatures increase demand
        if avg_temp < 10:
            demand_level = 2
        # Hot weather decreases demand
        if avg_temp > 25:
            demand_level = 0
    
    # Painkillers: More consistent year-round, but higher in extreme temperatures
    elif category == "Painkillers":
        # Extreme temperatures (hot or cold) increase demand
        if avg_temp < 5 or avg_temp > 30:
            demand_level = 2
        # Moderate demand in normal conditions
        else:
            demand_level = 1
    
    # Add some randomness to make the model more realistic
    # 10% chance to shift demand up or down by one level
    rand = np.random.random()
    if rand < 0.05 and demand_level > 0:  # 5% chance to decrease
        demand_level -= 1
    elif rand > 0.95 and demand_level < 2:  # 5% chance to increase
        demand_level += 1
    
    return demand_level

def train_model():
    """
    Train a RandomForestClassifier model on synthetic data
    
    Returns:
        Trained model
    """
    # Generate synthetic data
    df = generate_synthetic_data()
    
    # Split features and target
    X = df[['region', 'month', 'season', 'avg_temp', 'humidity', 'category']]
    y = df['demand_level']
    
    # Split data into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")
    
    # Train RandomForestClassifier
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low", "Moderate", "High"]))
    
    # Save model
    model_dir = Path("app/models")
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "trained_model.pkl"
    
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    
    print(f"Model saved to {model_path}")
    
    return model

if __name__ == "__main__":
    train_model()