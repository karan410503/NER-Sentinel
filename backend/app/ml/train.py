import os
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score
import joblib

from app.ml.data_generator import generate_synthetic_data

def train_from_dataframe(df):
    """Trains ETA and Disruption models from a pandas DataFrame and returns metrics."""
    
    # Optional schema validation could go here
    required_cols = ['vehicle_type_encoded', 'base_distance_km', 'weather_severity', 'terrain_complexity', 'actual_eta_minutes', 'has_disruption']
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in dataset: {missing}")

    X = df[['vehicle_type_encoded', 'base_distance_km', 'weather_severity', 'terrain_complexity']]
    y_eta = df['actual_eta_minutes']
    y_disruption = df['has_disruption']
    
    # Train ETA Regressor
    X_train_eta, X_test_eta, y_train_eta, y_test_eta = train_test_split(X, y_eta, test_size=0.2, random_state=42)
    eta_model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    eta_model.fit(X_train_eta, y_train_eta)
    eta_preds = eta_model.predict(X_test_eta)
    mae = mean_absolute_error(y_test_eta, eta_preds)
    
    # Train Disruption Classifier
    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(X, y_disruption, test_size=0.2, random_state=42)
    disruption_model = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    disruption_model.fit(X_train_d, y_train_d)
    d_preds = disruption_model.predict(X_test_d)
    acc = accuracy_score(y_test_d, d_preds)
    
    # Save models
    save_dir = os.path.join(os.path.dirname(__file__), 'saved_models')
    os.makedirs(save_dir, exist_ok=True)
    
    eta_model_path = os.path.join(save_dir, 'eta_xgboost.json')
    disruption_model_path = os.path.join(save_dir, 'disruption_xgboost.json')
    
    eta_model.save_model(eta_model_path)
    disruption_model.save_model(disruption_model_path)
    
    return {
        "eta_mae": float(mae),
        "disruption_accuracy": float(acc)
    }

def train_and_save_models():
    print("Generating synthetic data...")
    df = generate_synthetic_data(10000)
    metrics = train_from_dataframe(df)
    print(f"ETA Model MAE: {metrics['eta_mae']:.2f} minutes")
    print(f"Disruption Model Accuracy: {metrics['disruption_accuracy']:.4f}")
    print("Models saved.")

if __name__ == "__main__":
    train_and_save_models()
