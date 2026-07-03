"""Train and persist the heart attack risk prediction model."""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_PATH = Path(__file__).parent / "final_heart_attack_dataset.csv"
MODEL_DIR = Path(__file__).parent / "model"
MODEL_PATH = MODEL_DIR / "heart_attack_model.joblib"
METADATA_PATH = MODEL_DIR / "model_metadata.joblib"

STRESS_MAP = {"Low": 3, "Medium": 5, "High": 8}
TARGET_MAP = {"negative": 0, "positive": 1, "0": 0, "1": 1}

FEATURE_COLUMNS = [
    "Age",
    "Sex",
    "Cholesterol",
    "Systolic",
    "Diastolic",
    "Heart Rate",
    "Diabetes",
    "Family History",
    "Smoking",
    "Obesity",
    "Alcohol Consumption",
    "Exercise Hours Per Week",
    "Diet",
    "Previous Heart Problems",
    "Medication Use",
    "Stress Level",
    "Sedentary Hours Per Day",
    "Income",
    "BMI",
    "Triglycerides",
    "Physical Activity Days Per Week",
    "Sleep Hours Per Day",
    "Country",
    "Continent",
    "Hemisphere",
]

NUMERIC_FEATURES = [
    "Age",
    "Cholesterol",
    "Systolic",
    "Diastolic",
    "Heart Rate",
    "Diabetes",
    "Family History",
    "Smoking",
    "Obesity",
    "Alcohol Consumption",
    "Exercise Hours Per Week",
    "Previous Heart Problems",
    "Medication Use",
    "Stress Level",
    "Sedentary Hours Per Day",
    "Income",
    "BMI",
    "Triglycerides",
    "Physical Activity Days Per Week",
    "Sleep Hours Per Day",
]

CATEGORICAL_FEATURES = ["Sex", "Diet", "Country", "Continent", "Hemisphere"]


def normalize_stress(value) -> float:
    text = str(value).strip()
    if text in STRESS_MAP:
        return float(STRESS_MAP[text])
    try:
        return float(text)
    except ValueError:
        return 5.0


def normalize_target(value):
    if pd.isna(value):
        return pd.NA
    text = str(value).strip().lower()
    if text in TARGET_MAP:
        return TARGET_MAP[text]
    try:
        return int(float(text))
    except ValueError:
        return pd.NA


def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    data = df.copy()
    bp = data["Blood Pressure"].astype(str).str.split("/", expand=True)
    data["Systolic"] = pd.to_numeric(bp[0], errors="coerce")
    data["Diastolic"] = pd.to_numeric(bp[1], errors="coerce")
    data["Stress Level"] = data["Stress Level"].map(normalize_stress)
    data["Hemisphere"] = (
        data["Hemisphere"]
        .astype(str)
        .str.replace(" Hemisphere", "", regex=False)
        .str.strip()
    )
    data["Heart Attack Risk"] = data["Heart Attack Risk"].map(normalize_target)
    return data.dropna(subset=["Systolic", "Diastolic", "Heart Attack Risk"])


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )
    classifier = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.08,
        max_depth=4,
        random_state=42,
    )
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )


def collect_category_options(df: pd.DataFrame) -> dict:
    return {
        "sex": sorted(df["Sex"].astype(str).unique().tolist()),
        "diet": sorted(df["Diet"].astype(str).unique().tolist()),
        "country": sorted(df["Country"].astype(str).unique().tolist()),
        "continent": sorted(df["Continent"].astype(str).unique().tolist()),
        "hemisphere": sorted(df["Hemisphere"].astype(str).unique().tolist()),
    }


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    data = preprocess_dataframe(df)

    x = data[FEATURE_COLUMNS]
    y = data["Heart Attack Risk"]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline()
    pipeline.fit(x_train, y_train)

    predictions = pipeline.predict(x_test)
    probabilities = pipeline.predict_proba(x_test)[:, 1]

    print("Accuracy:", round(accuracy_score(y_test, predictions), 4))
    print("ROC AUC:", round(roc_auc_score(y_test, probabilities), 4))
    print(classification_report(y_test, predictions, target_names=["Low Risk", "High Risk"]))

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    metadata = {
        "feature_columns": FEATURE_COLUMNS,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "category_options": collect_category_options(data),
        "stress_levels": [
            {"label": "Low", "value": 3},
            {"label": "Medium", "value": 5},
            {"label": "High", "value": 8},
        ],
    }
    joblib.dump(metadata, METADATA_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()
