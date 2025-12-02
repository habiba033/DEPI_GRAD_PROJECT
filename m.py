from DS1.cardio_predict import predict_lifestyle
from DS2.clinical_predict import predict_clinical

def integrated_decision(life_dict, clin_dict):
    pred_life, p_life = predict_lifestyle(life_dict)

    # حدد لو العمر ≥ 40 من Age_Category
    age_cat = life_dict["Age_Category"]
    age_cats = ["18-24","25-29","30-34","35-39","40-44",
                "45-49","50-54","55-59","60-64","65-69","70-74","75-79","80+"]
    is_over_40 = age_cats.index(age_cat) >= 4

    if pred_life == 0:
        # Lifestyle جيد
        if not is_over_40:
            return {
                "stage": "lifestyle_only",
                "life_pred": pred_life,
                "clin_pred": None,
                "interpretation": "Healthy lifestyle and young age.",
                "recommendation": "Maintain habits and do routine annual checkups."
            }
        # سن ≥ 40 → نكمل clinical
    else:
        if not is_over_40:
            return {
                "stage": "lifestyle_only_risky",
                "life_pred": pred_life,
                "clin_pred": None,
                "interpretation": "Risky lifestyle but young age.",
                "recommendation": "Strong lifestyle modification, but no urgent clinical alarm."
            }

    # أي حالة بموديل لايف ستايل خطِر + سن ≥ 40 أو lifestyle جيد لكن سن كبير → نروح لموديل 2
    pred_clin, p_clin = predict_clinical(clin_dict)

    # جدول الحالات الأربعة:
    if pred_life == 0 and pred_clin == 0:
        status = "Healthy overall"
        rec = "Maintain current habits and follow periodic checkups."
    elif pred_life == 1 and pred_clin == 0:
        status = "Lifestyle risk only"
        rec = "Focus on exercise, smoking cessation, and diet improvement."
    elif pred_life == 0 and pred_clin == 1:
        status = "Clinical/genetic risk"
        rec = "Clinical follow-up and further diagnostic tests are recommended."
    else:  # 1 and 1
        status = "High combined risk"
        rec = "Urgent cardiology consultation and aggressive lifestyle overhaul are needed."

    return {
        "stage": "combined",
        "life_pred": pred_life,
        "life_proba": p_life,
        "clin_pred": pred_clin,
        "clin_proba": p_clin,
        "interpretation": status,
        "recommendation": rec
    }
