import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_synthetic_data(num_records=5000):
    np.random.seed(42)
    random.seed(42)

    origins = ['Guwahati Hub', 'Silchar Hub', 'Jorhat Hub', 'Dibrugarh Hub', 'Tezpur Hub']
    destinations = ['Shillong Medical Center', 'Tawang Clinic', 'Aizawl Hospital', 'Imphal Care', 'Kohima Health']
    vehicles = ['Heavy Truck (Medicine)', 'Medium Truck (Food Supply)', 'Light Vehicle (Fast Relief)']
    
    # Mapping for vehicle encoding
    # Heavy: 0, Medium: 1, Light: 2
    vehicle_map = {
        'Heavy Truck (Medicine)': 0,
        'Medium Truck (Food Supply)': 1,
        'Light Vehicle (Fast Relief)': 2
    }

    data = []

    for _ in range(num_records):
        origin = random.choice(origins)
        destination = random.choice(destinations)
        vehicle = random.choice(vehicles)
        
        # Base Distance (km) between 50 and 500
        base_distance_km = random.uniform(50, 500)
        
        # Base ETA in minutes (avg 40 km/h)
        base_eta = (base_distance_km / 40.0) * 60
        
        # Weather severity (0 to 10)
        weather_severity = np.random.beta(2, 5) * 10
        
        # Terrain complexity (0 to 10) - higher for Shillong/Tawang
        terrain_base = 3
        if destination in ['Shillong Medical Center', 'Tawang Clinic']:
            terrain_base = 7
        terrain_complexity = min(10.0, max(0.0, random.gauss(terrain_base, 2)))
        
        # Calculate actual ETA with delays
        # Heavy trucks are slower in bad weather/terrain
        vehicle_delay_factor = {
            'Heavy Truck (Medicine)': 1.5,
            'Medium Truck (Food Supply)': 1.2,
            'Light Vehicle (Fast Relief)': 1.0
        }[vehicle]
        
        weather_delay = weather_severity * 5 * vehicle_delay_factor
        terrain_delay = terrain_complexity * 3 * vehicle_delay_factor
        
        # Random traffic/noise
        random_noise = random.gauss(0, 15)
        
        actual_eta = base_eta + weather_delay + terrain_delay + random_noise
        actual_eta = max(base_eta * 0.8, actual_eta) # Can't be impossibly fast
        
        # Disruption probability (0 or 1)
        # High weather or terrain increases disruption probability
        disruption_prob = (weather_severity * 0.4 + terrain_complexity * 0.4 + (vehicle_delay_factor - 1.0) * 2) / 10.0
        has_disruption = 1 if random.random() < disruption_prob else 0
        
        data.append({
            'origin': origin,
            'destination': destination,
            'vehicle_type': vehicle,
            'vehicle_type_encoded': vehicle_map[vehicle],
            'base_distance_km': round(base_distance_km, 2),
            'weather_severity': round(weather_severity, 2),
            'terrain_complexity': round(terrain_complexity, 2),
            'actual_eta_minutes': round(actual_eta, 2),
            'has_disruption': has_disruption
        })

    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    df = generate_synthetic_data(100)
    print("Generated data preview:")
    print(df.head())
