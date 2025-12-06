from flask import Flask, render_template, request, redirect, url_for, jsonify 
from DS1.cardio_predict import full_lifestyle_eval
from DS1.cardio_predict import predict_lifestyle
from DS2.clinical_predict import predict_clinical
from DS2.clinical_predict import full_clinical_eval
from DS2.clinical_visuals import get_clinical_visual_stats
from DS1.Cardio_visuals import get_visual_stats
import pandas as pd

app = Flask(__name__)

AGE_CATS = ["18-24","25-29","30-34","35-39","40-44",
            "45-49","50-54","55-59","60-64","65-69","70-74","75-79","80+"]

# ---------- Decision Layer ----------

def integrated_decision(life_dict, clin_dict=None):
    pred_life, p_life = predict_lifestyle(life_dict)

    age_cat = life_dict.get("Age_Category")
    is_over_40 = False
    if age_cat in AGE_CATS:
        is_over_40 = AGE_CATS.index(age_cat) >= 4
    else:
    # fallback: if age provided as number, consider it
        try:
            age_val = int(life_dict.get("Age", 0))
            is_over_40 = age_val >= 40
        except Exception:
            is_over_40 = False

    # حالة lifestyle فقط بدون clinical
    if clin_dict is None:
        if pred_life == 0 and not is_over_40:
            return {
                "stage": "lifestyle_only",
                "life_pred": pred_life,
                "life_proba": p_life,
                "interpretation": "Healthy lifestyle and young age.",
                "recommendation": "Maintain your current habits and do annual checkups."
            }
        elif pred_life == 1 and not is_over_40:
            return {
                "stage": "lifestyle_only_risky",
                "life_pred": pred_life,
                "life_proba": p_life,
                "interpretation": "Risky lifestyle but young age.",
                "recommendation": "Improve exercise, diet, and smoking/alcohol habits; no urgent clinical alarm yet."
            }
        # أي حالة تتطلب clinical:
        return {
            "stage": "need_clinical",
            "life_pred": pred_life,
            "life_proba": p_life,
            "message": "Lifestyle profile and/or age suggest that a clinical assessment is recommended."
        }

    # هنا عندنا بيانات clinical كمان
    pred_clin, p_clin = predict_clinical(clin_dict)

    if pred_life == 0 and pred_clin == 0:
        status = "Healthy overall"
        rec = "Maintain healthy habits and continue periodic medical checkups."
    elif pred_life == 1 and pred_clin == 0:
        status = "Lifestyle risk only"
        rec = "Focus on lifestyle changes: more exercise, smoking cessation, healthier diet."
    elif pred_life == 0 and pred_clin == 1:
        status = "Clinical/genetic risk"
        rec = "Consult a cardiologist and perform further diagnostic tests."
    else:
        status = "High combined risk"
        rec = "Urgent cardiology consultation and aggressive lifestyle modification are needed."

    return {
        "stage": "combined",
        "life_pred": pred_life,
        "life_proba": p_life,
        "clin_pred": pred_clin,
        "clin_proba": p_clin,
        "interpretation": status,
        "recommendation": rec
    }

# ---------- Routes ----------

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/models/lifestyle", methods=["GET", "POST"])
def lifestyle_form():
    decision = None
    tips = []
    form = None

    if request.method == "POST":
        form = request.form.to_dict()

        life_dict, pred, proba, tips = full_lifestyle_eval(form)

        age_cat = life_dict["Age_Category"]
        age_idx = AGE_CATS.index(age_cat)
        is_over_40 = age_idx >= 4

        # threshold مناسب (اختَرته أنت حسب الموديل)
        high_risk = proba >= 0.02
        print("DEBUG lifestyle pred, proba, high_risk:",
              pred, proba, high_risk, "age_cat:", age_cat)

        # 1) فقط لو high_risk + عمر ≥ 40 → تحويل مباشر إلى Stage 2
        if high_risk and is_over_40:
            return redirect(url_for(
                "clinical_form",
                age_cat=age_cat,
                life_pred=pred,
                life_proba=proba,
            ))

        # 2) باقي الحالات → نعرض بطاقة Stage 1 + زر اختيارى للـ Stage 2
        if high_risk:
            level = "Moderate"
            msg = "Your lifestyle profile shows several risk factors. Lifestyle modification is strongly recommended."
        else:
            level = "Low"
            msg = "Your lifestyle profile appears relatively low risk based on the model."

        decision = {
            "type": "advice",
            "level": level,
            "message": msg,
            "tips": tips,
            "pred": pred,
            "proba": proba,
            "age_cat": age_cat,
        }

    return render_template(
        "lifestyle_form.html",
        age_cats=AGE_CATS,
        decision=decision,
        form_data=form,
    )

@app.route("/predict/clinical", methods=["GET", "POST"])
def clinical_form():
    decision = None
    form = None

    # نأخذ age من الـ query string إن وُجد
    age_cat = request.args.get("age_cat", default=None, type=str)
    default_age = None
    if age_cat:
        # مثال بسيط لتحويل فئة عمرية لسن تقريبي
        if "-" in age_cat:
            lo, hi = age_cat.split("-")
            default_age = int((int(lo) + int(hi)) / 2)
        elif age_cat.endswith("+"):
            default_age = int(age_cat[:-1])

    if request.method == "POST":
        form = request.form.to_dict()
        clin_dict, pred, proba, tips = full_clinical_eval(form)
        high_risk = proba >= 0.5
        level = "High" if high_risk else "Low"
        msg = "Clinical indicators suggest high risk." if high_risk else "Clinical risk appears low."

        decision = {
            "level": level,
            "message": msg,
            "pred": pred,
            "proba": proba,
            "tips": tips,
        }

    return render_template("clinical_form.html",
                           decision=decision,
                           form_data=form,
                           default_age=default_age)

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route('/api/visuals-data')
def api_visuals_data():
    return jsonify(get_visual_stats())


CLINICAL_DATA_PATH = r"C:\Users\habib\OneDrive\المستندات\Graduation Project\GRAD-proj-DEPI\DS2\heart_cleveland_upload.csv"
@app.route("/api/clinical-visuals-data")
def api_clinical_visuals_data():
    df = pd.read_csv(CLINICAL_DATA_PATH)
    stats = get_clinical_visual_stats(df)
    return jsonify(stats)

@app.route("/visuals")
def visuals():
    return render_template("visuals_hub.html")


@app.route("/visuals/cardio")
def visuals_cardio():
    return render_template("visuals.html")  

@app.route("/visuals/clinical")
def visuals_clinical():
    return render_template("visuals.html")  



if __name__ == "__main__":
    app.run(debug=True)
