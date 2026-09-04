import os
import xgboost as xgb
import random

class MLService:
    def __init__(self):
        self.eta_model = None
        self.disruption_model = None
        
        # Vehicle mapping
        self.vehicle_map = {
            'Heavy Truck (Medicine)': 0,
            'Medium Truck (Food Supply)': 1,
            'Light Vehicle (Fast Relief)': 2
        }

    def load_models(self):
        models_dir = os.path.join(os.path.dirname(__file__), '..', 'ml', 'saved_models')
        eta_model_path = os.path.join(models_dir, 'eta_xgboost.json')
        disruption_model_path = os.path.join(models_dir, 'disruption_xgboost.json')
        
        if os.path.exists(eta_model_path):
            self.eta_model = xgb.Booster()
            self.eta_model.load_model(eta_model_path)
            print("Loaded ETA Model.")
            
        if os.path.exists(disruption_model_path):
            self.disruption_model = xgb.Booster()
            self.disruption_model.load_model(disruption_model_path)
            print("Loaded Disruption Model.")

    def predict_eta(self, origin: str, destination: str, vehicle_type: str):
        # We don't have real distance in input, so we mock it based on locations
        base_distance = 150.0
        if "Shillong" in destination or "Tawang" in destination:
            base_distance = 300.0
            
        weather_severity = 3.0  # mock current weather
        terrain_complexity = 5.0
        if "Shillong" in destination or "Tawang" in destination:
            terrain_complexity = 8.0
            weather_severity = 6.0
            
        vehicle_encoded = self.vehicle_map.get(vehicle_type, 1)
        
        features = [[vehicle_encoded, base_distance, weather_severity, terrain_complexity]]
        feature_names = ['vehicle_type_encoded', 'base_distance_km', 'weather_severity', 'terrain_complexity']
        
        # We need a DMatrix for Booster predictions
        dmatrix = xgb.DMatrix(features, feature_names=feature_names)
        
        predicted_eta_minutes = base_distance / 40.0 * 60  # default fallback
        confidence = 75
        
        if self.eta_model:
            predicted_eta_minutes = self.eta_model.predict(dmatrix)[0]
            confidence = min(98, max(50, 95 - int(weather_severity * 2)))
        
        # Standard ETA based on simple math
        standard_eta = base_distance / 40.0 * 60
        
        return {
            "predictedEta": f"{int(predicted_eta_minutes // 60)}h {int(predicted_eta_minutes % 60)}m",
            "standardEta": f"{int(standard_eta // 60)}h {int(standard_eta % 60)}m",
            "confidenceScore": confidence,
            "factors": [
                {"name": "Terrain Difficulty", "impact": f"+{int(terrain_complexity * 2)}m", "type": "negative" if terrain_complexity > 5 else "positive"},
                {"name": "Weather Condition", "impact": f"+{int(weather_severity * 3)}m", "type": "negative" if weather_severity > 4 else "positive"}
            ]
        }

    def get_disruption_forecasts(self):
        # We could predict using the model on a grid of locations
        # For simplicity, let's generate a couple of predictions manually applying the model
        forecasts = []
        locations = [
            ("NH-37, near Kaziranga", 8.0, 4.0),
            ("Silchar Lowlands", 9.0, 5.0),
            ("Dimapur-Kohima Highway", 5.0, 8.0)
        ]
        feature_names = ['vehicle_type_encoded', 'base_distance_km', 'weather_severity', 'terrain_complexity']
        
        for idx, (loc, weather, terrain) in enumerate(locations):
            # mock features
            features = [[0, 100, weather, terrain]]
            dmatrix = xgb.DMatrix(features, feature_names=feature_names)
            
            probability = 50
            if self.disruption_model:
                # The model outputs probabilities if objective is binary:logistic
                prob = self.disruption_model.predict(dmatrix)[0]
                probability = int(prob * 100)

            
            if probability > 30:
                forecasts.append({
                    "id": f"DF-{idx+1:03d}",
                    "type": "Severe Weather Risk" if weather > 7 else "Road Collapse Risk",
                    "location": loc,
                    "probability": probability,
                    "timeframe": "+6 Hours",
                    "recommendation": "Reroute critical supplies immediately" if probability > 70 else "Monitor situation"
                })
        
        return forecasts

ml_service = MLService()
