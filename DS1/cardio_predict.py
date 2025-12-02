# DS1/cardio_predict.py
import joblib
import pandas as pd
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "Models" / "stage1_xgb_latest.joblib"
xgb_pipe = joblib.load(MODEL_PATH)

def predict_lifestyle(input_dict: dict):
    df = pd.DataFrame([input_dict])
    print("\n=== DEBUG LIFESTYLE INPUT ===")
    print(df.T)  # عرض الأعمدة والقيم
    proba = xgb_pipe.predict_proba(df)[:, 1]
    pred  = (proba >= 0.5).astype(int)
    print("Pred:", int(pred[0]), "Prob:", float(proba[0]))
    return int(pred[0]), float(proba[0])

def lifestyle_tips(row: dict):
    """
    row: dict من أعمدة الـ lifestyle dataset (بعد mapping من الفورم).
    ترجع قائمة نصائح (strings) بناءً على قيم المريض.
    """
    tips = []

    # General Health
    gh = row.get("General_Health")
    if gh in ["Fair", "Poor"]:
        tips.append("Your general health self-rating is low; schedule a full checkup and discuss preventive strategies with your doctor.")

    # Checkup recency
    checkup = row.get("Checkup")
    if checkup in ["5 or more years ago", "Never"]:
        tips.append("You have not had a recent medical checkup; consider booking a routine heart and metabolic screening.")

    # Exercise
    if row.get("Exercise") == "No":
        tips.append("Regular physical activity (at least 150 minutes of moderate exercise per week) can significantly reduce heart risk.")

    # Smoking
    if row.get("Smoking_History") == "Yes":
        tips.append("Smoking greatly increases cardiovascular risk; join a smoking cessation program and avoid tobacco exposure.")

    # Alcohol
    alc = float(row.get("Alcohol_Consumption", 0) or 0)
    if alc > 0:
        tips.append("Limit or avoid alcohol intake to reduce blood pressure and improve heart and liver health.")

    # BMI / Obesity
    try:
        bmi = float(row.get("BMI", 0) or 0)
        if bmi >= 30:
            tips.append("Your BMI is in the obese range; a structured weight-loss plan with dietitian support is recommended.")
        elif bmi >= 25:
            tips.append("Your BMI is in the overweight range; modest weight reduction and increased activity can lower heart risk.")
    except ValueError:
        pass

    # Diet – fruits & vegetables
    fruit = float(row.get("Fruit_Consumption", 0) or 0)
    veg   = float(row.get("Green_Vegetables_Consumption", 0) or 0)
    if fruit < 20 or veg < 10:   # غيِّر الأرقام حسب معنى الأعمدة عندك
        tips.append("Increase your daily intake of fruits and green vegetables to at least 5 servings per day.")

    # Fried / fast food
    fried = float(row.get("FriedPotato_Consumption", 0) or 0)
    if fried > 8:
        tips.append("Reduce fried and fast foods to lower bad cholesterol and support healthy weight.")

    # Diabetes
    if row.get("Diabetes") in ["Yes", "Borderline"]:
        tips.append("Monitor your blood sugar regularly and follow your diabetes care plan to protect your heart and kidneys.")

    # Depression
    if row.get("Depression") == "Yes":
        tips.append("Depressive symptoms can affect heart health; consider speaking with a mental health professional.")

    # Arthritis / limited mobility
    if row.get("Arthritis") == "Yes":
        tips.append("Joint issues can limit activity; ask your doctor or physiotherapist for low‑impact exercise options.")

    # Age & sex (مثال مبسّط)
    age_cat = row.get("Age_Category", "")
    if age_cat in ["60-64","65-69","70-74","75-79","80+"]:
        tips.append("Given your age, regular blood pressure, cholesterol, and heart rhythm checks are especially important.")

    return tips

def full_lifestyle_eval(form_dict: dict):
    """
    تأخذ بيانات الـ form من Flask، تبني life_dict الذي يناسب الموديل،
    ثم ترجع (life_dict, pred, proba, tips).
    """
    life_dict = {
        "General_Health": form_dict["generalHealth"],
        "Checkup": "Within the past year",
        "Exercise": form_dict["exercise"],
        "Heart_Disease": "No",
        "Skin_Cancer": "No",
        "Other_Cancer": "No",
        "Depression": "No",
        "Diabetes": form_dict["diabetes"],
        "Arthritis": "No",
        "Sex": form_dict["sex"],
        "Age_Category": form_dict["ageCategory"],
        "Height_(cm)": float(form_dict.get("height", 170) or 170),
        "Weight_(kg)": float(form_dict.get("weight", 70) or 70),
        "BMI": float(form_dict["bmi"]),
        "Smoking_History": form_dict["smoking"],
        "Alcohol_Consumption": float(form_dict.get("alcohol", 0) or 0),
        "Fruit_Consumption": float(form_dict.get("fruit", 30) or 30),
        "Green_Vegetables_Consumption": float(form_dict.get("veg", 15) or 15),
        "FriedPotato_Consumption": float(form_dict.get("fried", 4) or 4),
    }

    pred, proba = predict_lifestyle(life_dict)
    tips = lifestyle_tips(life_dict)
    return life_dict, pred, proba, tips