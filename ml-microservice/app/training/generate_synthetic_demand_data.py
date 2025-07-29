import csv
import random
from datetime import datetime

regions = ["northeast", "northwest", "southeast", "southwest", "central"]
medicine_categories = ["Antihistamines", "ColdRelief", "Painkillers", "Antibiotics", "DigestiveAids"]

# Demand logic based on month and region (simplified)
def get_demand_level(category, month, region, avg_temp, humidity):
    if category == "Antihistamines":
        if 3 <= month <= 6 and humidity > 60:
            return "High"
        elif 7 <= month <= 9:
            return "Moderate"
        else:
            return "Low"
    elif category == "ColdRelief":
        if month in [11, 12, 1, 2]:
            return "High"
        elif avg_temp < 15:
            return "Moderate"
        else:
            return "Low"
    elif category == "Painkillers":
        if avg_temp > 30:
            return "High"
        elif 20 < avg_temp <= 30:
            return "Moderate"
        else:
            return "Low"
    elif category == "Antibiotics":
        if humidity > 70:
            return "High"
        elif humidity > 50:
            return "Moderate"
        else:
            return "Low"
    elif category == "DigestiveAids":
        if month in [5, 6, 7, 8]:
            return "High"
        elif avg_temp > 25:
            return "Moderate"
        else:
            return "Low"
    return "Low"

def generate_data(filename="synthetic_medicine_demand.csv"):
    start_year = datetime.now().year - 10
    end_year = datetime.now().year
    rows = []
    for year in range(start_year, end_year):
        for month in range(1, 13):
            for region in regions:
                # Simulate climate
                if region in ["northeast", "northwest"]:
                    base_temp = random.uniform(10, 25)
                elif region in ["southeast", "southwest"]:
                    base_temp = random.uniform(20, 35)
                else:
                    base_temp = random.uniform(15, 30)
                # Add seasonal variation
                if month in [12, 1, 2]:
                    avg_temp = base_temp - random.uniform(2, 6)
                elif month in [6, 7, 8]:
                    avg_temp = base_temp + random.uniform(2, 6)
                else:
                    avg_temp = base_temp + random.uniform(-2, 2)
                humidity = random.uniform(40, 80)
                row = {
                    "year": year,
                    "month": month,
                    "region": region,
                    "avg_temp": round(avg_temp, 1),
                    "humidity": round(humidity, 1)
                }
                for cat in medicine_categories:
                    row[f"{cat}_demand_level"] = get_demand_level(cat, month, region, avg_temp, humidity)
                rows.append(row)
    # Write to CSV
    fieldnames = ["year", "month", "region", "avg_temp", "humidity"] + [f"{cat}_demand_level" for cat in medicine_categories]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    print(f"Synthetic dataset generated: {filename}")

if __name__ == "__main__":
    generate_data()