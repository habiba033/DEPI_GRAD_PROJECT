# DS2/clinical_predict.py
import joblib
import pandas as pd
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "Models" / "stage1_svm_latest.joblib"
clin_model = joblib.load(MODEL_PATH)

def predict_clinical(clin_dict: dict):
    """يأخذ dict بأعمدة DS2 ويرجع (pred, proba)."""
    df = pd.DataFrame([clin_dict])
    proba = clin_model.predict_proba(df)[:, 1]
    pred = (proba >= 0.5).astype(int)[0]
    return int(pred), float(proba[0])

def clinical_tips(clin_dict: dict):
    """نصائح rule-based بناءً على القياسات السريرية."""
    tips = []
    age = clin_dict.get("Age (years)", 0)
    if age >= 60:
        tips.append("Given your age, regular cardiology follow-up and blood pressure monitoring are recommended.")

    bp = clin_dict.get("Resting BP (mm Hg)", 0)
    if bp >= 140:
        tips.append("Your resting blood pressure is elevated; discuss antihypertensive treatment with your doctor.")
    elif bp >= 130:
        tips.append("Your blood pressure is in the high-normal range; reduce salt intake and monitor regularly.")

    chol = clin_dict.get("Cholesterol (mg/dl)", 0)
    if chol >= 240:
        tips.append("Your cholesterol is high; consider lipid-lowering therapy and dietary changes.")
    elif chol >= 200:
        tips.append("Borderline high cholesterol; improve diet and physical activity.")

    max_hr = clin_dict.get("Max Heart Rate (bpm)", 0)
    if max_hr < 100 and age > 50:
        tips.append("Relatively low maximal heart rate; discuss exercise tolerance and potential ischemia tests.")

    oldpeak = float(clin_dict.get("ST Depression (oldpeak)", 0) or 0)
    if oldpeak >= 2:
        tips.append("Significant ST depression suggests possible ischemia; further cardiology evaluation is advised.")

    if clin_dict.get("Fasting Blood Sugar", 0) == 1:
        tips.append("Elevated fasting blood sugar; screen for diabetes and optimize glycemic control.")

    if clin_dict.get("Exercise Angina", 0) == 1:
        tips.append("Chest pain during exercise is concerning; avoid heavy exertion until cardiology review.")

    return tips

def full_clinical_eval(form_dict: dict):
    """
    يأخذ بيانات الـ form من Flask، يحولها إلى أعمدة الموديل،
    ثم يرجع (clin_dict, pred, proba, tips).
    """
    clin_dict = {
        "Age (years)": int(form_dict["age"]),
        "Resting BP (mm Hg)": int(form_dict["restingBP"]),
        "Cholesterol (mg/dl)": int(form_dict["cholesterol"]),
        "Fasting Blood Sugar": int(form_dict.get("fbs", 0)),
        "Fasting Blood Sugar Missing": 0,
        "Resting ECG": form_dict.get("restingECG", "Normal"),
        "Max Heart Rate (bpm)": int(form_dict["maxHR"]),
        "Exercise Angina": 1 if form_dict.get("exAngina") == "Yes" else 0,
        "Exercise Angina Missing": 0,
        "ST Depression (oldpeak)": float(form_dict["oldpeak"]),
        "ST Slope": form_dict.get("slope", "Up"),
        "Major Vessels (0–3)": int(form_dict.get("vessels", 0)),
        "Thalassemia": form_dict.get("thal", "Normal"),
        "Chest Pain Type": form_dict["chestPain"],
    }

    pred, proba = predict_clinical(clin_dict)
    tips = clinical_tips(clin_dict)
    return clin_dict, pred, proba, tips
