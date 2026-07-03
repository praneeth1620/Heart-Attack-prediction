"""FastAPI backend for heart attack risk prediction."""

from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "model" / "heart_attack_model.joblib"
METADATA_PATH = ROOT / "model" / "model_metadata.joblib"

app = FastAPI(
    title="Heart Attack Risk Predictor API",
    description="Predict cardiovascular risk from patient health metrics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = None
metadata = None


class PatientInput(BaseModel):
    age: int = Field(..., ge=1, le=120)
    sex: str
    cholesterol: float = Field(..., ge=50, le=600)
    systolic: int = Field(..., ge=70, le=250)
    diastolic: int = Field(..., ge=40, le=150)
    heart_rate: int = Field(..., ge=30, le=220)
    diabetes: Literal[0, 1]
    family_history: Literal[0, 1]
    smoking: Literal[0, 1]
    obesity: Literal[0, 1]
    alcohol_consumption: Literal[0, 1]
    exercise_hours_per_week: float = Field(..., ge=0, le=30)
    diet: str
    previous_heart_problems: Literal[0, 1]
    medication_use: Literal[0, 1]
    stress_level: float = Field(..., ge=1, le=10)
    sedentary_hours_per_day: float = Field(..., ge=0, le=24)
    income: float = Field(..., ge=0)
    bmi: float = Field(..., ge=10, le=60)
    triglycerides: float = Field(..., ge=20, le=600)
    physical_activity_days_per_week: int = Field(..., ge=0, le=7)
    sleep_hours_per_day: float = Field(..., ge=1, le=16)
    country: str
    continent: str
    hemisphere: str


class PredictionResponse(BaseModel):
    risk_label: str
    risk_level: Literal["low", "moderate", "high"]
    probability: float
    confidence: float
    message: str
    recommendations: list[str]


def load_artifacts() -> None:
    global pipeline, metadata
    if not MODEL_PATH.exists() or not METADATA_PATH.exists():
        raise FileNotFoundError(
            "Model artifacts not found. Run `py train_model.py` first."
        )
    pipeline = joblib.load(MODEL_PATH)
    metadata = joblib.load(METADATA_PATH)


@app.on_event("startup")
def startup() -> None:
    load_artifacts()


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "model_loaded": pipeline is not None}


@app.get("/api/options")
def get_options() -> dict:
    if metadata is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return metadata["category_options"]


def build_feature_row(patient: PatientInput) -> pd.DataFrame:
    row = {
        "Age": patient.age,
        "Sex": patient.sex,
        "Cholesterol": patient.cholesterol,
        "Systolic": patient.systolic,
        "Diastolic": patient.diastolic,
        "Heart Rate": patient.heart_rate,
        "Diabetes": patient.diabetes,
        "Family History": patient.family_history,
        "Smoking": patient.smoking,
        "Obesity": patient.obesity,
        "Alcohol Consumption": patient.alcohol_consumption,
        "Exercise Hours Per Week": patient.exercise_hours_per_week,
        "Diet": patient.diet,
        "Previous Heart Problems": patient.previous_heart_problems,
        "Medication Use": patient.medication_use,
        "Stress Level": patient.stress_level,
        "Sedentary Hours Per Day": patient.sedentary_hours_per_day,
        "Income": patient.income,
        "BMI": patient.bmi,
        "Triglycerides": patient.triglycerides,
        "Physical Activity Days Per Week": patient.physical_activity_days_per_week,
        "Sleep Hours Per Day": patient.sleep_hours_per_day,
        "Country": patient.country,
        "Continent": patient.continent,
        "Hemisphere": patient.hemisphere,
    }
    return pd.DataFrame([row])


def risk_level_from_probability(probability: float) -> str:
    if probability < 0.35:
        return "low"
    if probability < 0.65:
        return "moderate"
    return "high"


def build_recommendations(patient: PatientInput, probability: float) -> list[str]:
    tips: list[str] = []
    if patient.smoking:
        tips.append("Consider a smoking cessation program to reduce cardiovascular strain.")
    if patient.bmi >= 30 or patient.obesity:
        tips.append("A balanced diet and regular activity can help manage weight and BMI.")
    if patient.exercise_hours_per_week < 3:
        tips.append("Aim for at least 150 minutes of moderate exercise per week.")
    if patient.stress_level >= 7:
        tips.append("Stress management techniques may support heart health.")
    if patient.sedentary_hours_per_day >= 8:
        tips.append("Reduce prolonged sitting with short movement breaks throughout the day.")
    if patient.diabetes:
        tips.append("Keep blood sugar levels monitored and follow your care plan.")
    if probability >= 0.5:
        tips.append("Consult a healthcare professional for a full cardiac evaluation.")
    if not tips:
        tips.append("Maintain your healthy habits and schedule routine check-ups.")
    return tips[:4]


@app.post("/api/predict", response_model=PredictionResponse)
def predict(patient: PatientInput) -> PredictionResponse:
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    features = build_feature_row(patient)
    probability = float(pipeline.predict_proba(features)[0][1])
    prediction = int(pipeline.predict(features)[0])
    confidence = float(max(probability, 1 - probability))
    risk_level = risk_level_from_probability(probability)

    if prediction == 1:
        risk_label = "Elevated Risk"
        message = "The model indicates a higher likelihood of heart attack risk based on the provided profile."
    else:
        risk_label = "Lower Risk"
        message = "The model indicates a lower likelihood of heart attack risk based on the provided profile."

    return PredictionResponse(
        risk_label=risk_label,
        risk_level=risk_level,
        probability=round(probability, 4),
        confidence=round(confidence, 4),
        message=message,
        recommendations=build_recommendations(patient, probability),
    )
