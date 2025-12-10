from flask import Flask, render_template, request, redirect, url_for, jsonify 
from DS1.cardio_predict import full_lifestyle_eval
from DS1.cardio_predict import predict_lifestyle
from DS2.clinical_predict import predict_clinical
from DS2.clinical_predict import full_clinical_eval
from DS2.clinical_visuals import get_clinical_visual_stats,df_viz
from DS1.Cardio_visuals import get_visual_stats

from flask_cors import CORS
from werkzeug.security import generate_password_hash
from models import db, User, PatientProfile, LabBranch, LifestylePrediction, ClinicalPrediction,Appointment
from datetime import datetime
from sqlalchemy import text


app = Flask(__name__)
#------------------CONNECT-------------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:habiba123@localhost:5433/MediPredict'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# INIT DB FROM models.py
db.init_app(app)
CORS(app)


#---------------------------------------------

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
        return {
            "stage": "need_clinical",
            "life_pred": pred_life,
            "life_proba": p_life,
            "message": "Lifestyle profile and/or age suggest that a clinical assessment is recommended."
        }

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


@app.route('/')                   
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

        high_risk = proba >= 0.02
        print("DEBUG lifestyle pred, proba, high_risk:",
              pred, proba, high_risk, "age_cat:", age_cat)

        if high_risk and is_over_40:
            return redirect(url_for(
                "clinical_form",
                age_cat=age_cat,
                life_pred=pred,
                life_proba=proba,
            ))

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

    age_cat = request.args.get("age_cat", default=None, type=str)
    default_age = None
    if age_cat:
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

    
@app.route("/api/clinical-visuals-data")
def clinical_visuals_data():
    return jsonify(get_clinical_visual_stats(df_viz))



@app.route("/visuals")  
def visuals():
    return render_template("visuals_hub.html")


@app.route('/visuals/cardio')
def visuals_cardio():
    return render_template('visuals.html')

@app.route('/visuals/clinical')
def visuals_clinical():
    return render_template('visuals.html')



@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    print("REGISTER DATA:", data)
    with app.app_context():  
        data = request.json
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"error": "Username exists"}), 400
        
        user = User(
            username=data['username'],
            password_hash=generate_password_hash(data['password']),
            full_name=data['name'],
            age=data['age']
        )
        db.session.add(user)
        db.session.flush()
        
        profile = PatientProfile(
            user_id=user.user_id,
            patient_id=f"PID-{datetime.now().strftime('%Y')}-{user.user_id:04d}"
        )
        db.session.add(profile)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "patient_id": profile.patient_id
        })

@app.route('/api/patients/<username>', methods=['GET'])
def get_patient(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = PatientProfile.query.filter_by(user_id=user.user_id).first()
    return jsonify({
        "username": user.username,
        "profile": {
            "name": user.full_name,
            "age": user.age,
            "patient_id": profile.patient_id if profile else None,
        }
    })



@app.route('/api/branches')
def get_branches():
    with app.app_context():
        branches = LabBranch.query.all()
        return jsonify([{
            "id": b.branch_id,
            "code": b.branch_code,
            "name": b.branch_name
        } for b in branches])


@app.route("/guest")
def guest_dashboard():
    return render_template("old_index.html")


@app.route("/patient")
def patient_page():
    return render_template("patient.html")

# ---------- PATIENT PREDICTION ROUTES (FORM + DB STORE) ----------
@app.route("/patient/lifestyle", methods=["GET", "POST"])
def patient_lifestyle_form():
    username = request.args.get("username")
    user = User.query.filter_by(username=username).first()
    if not user:
        return "Unauthorized", 401

    decision = None
    tips = []
    form = None

    if request.method == "POST":
        form = request.form.to_dict()
        life_dict, pred, proba, tips = full_lifestyle_eval(form)

        lp = LifestylePrediction(
            user_id=user.user_id,
            general_health=life_dict.get('General_Health'),
            exercise=life_dict.get('Exercise'),
            diabetes=life_dict.get('Diabetes'),
            sex=life_dict.get('Sex'),
            age_category=life_dict.get('Age_Category'),
            bmi=life_dict.get('BMI'),
            smoking_history=life_dict.get('Smoking_History'),
            alcohol_consumption=life_dict.get('Alcohol'),
            fruit_consumption=life_dict.get('Fruit'),
            green_veg_consumption=life_dict.get('Green_Veg'),
            fried_potato_consumption=life_dict.get('Fried_Potato'),
            risk_prediction="High" if pred == 1 else "Low",
            prediction_score=float(proba)
        )
        db.session.add(lp)
        db.session.commit()

        age_cat = life_dict["Age_Category"]
        age_idx = AGE_CATS.index(age_cat)
        is_over_40 = age_idx >= 4
        high_risk = proba >= 0.02

        if high_risk and is_over_40:
            return redirect(url_for(
                "patient_clinical_form",
                username=username,
                age_cat=age_cat,
                life_pred=pred,
                life_proba=proba
            ))

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

        # save tips into profile AFTER prediction
        profile = PatientProfile.query.filter_by(user_id=user.user_id).first()
        if profile:
            profile.tips = tips 
            db.session.add(profile)
            db.session.commit()

    return render_template(
        "lifestyle_form.html",
        age_cats=AGE_CATS,
        decision=decision,
        form_data=form,
    )

@app.route("/patient/clinical", methods=["GET", "POST"])
def patient_clinical_form():
    username = request.args.get("username")
    user = User.query.filter_by(username=username).first()
    if not user:
        return "Unauthorized", 401

    decision = None
    form = None

    age_cat = request.args.get("age_cat", default=None, type=str)
    default_age = None
    if age_cat:
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

        cp = ClinicalPrediction(
            user_id=user.user_id,
            age_years=int(clin_dict.get('Age (years)', 0)),
            resting_bp_systolic=int(clin_dict.get('Resting BP (mm Hg)', 0)),
            cholesterol_mg_dl=int(clin_dict.get('Cholesterol', 0)),
            fasting_blood_sugar=int(clin_dict.get('Fasting Blood Sugar', 0)),
            resting_ecg=clin_dict.get('Resting ECG'),
            max_heart_rate=int(clin_dict.get('Max Heart Rate', 0)),
            exercise_angina=bool(clin_dict.get('Exercise Angina')),
            st_depression_oldpeak=float(clin_dict.get('Oldpeak', 0.0)),
            st_slope=clin_dict.get('Slope'),
            major_vessels=int(clin_dict.get('Vessels', 0)),
            thalassemia=clin_dict.get('Thalassemia'),
            chest_pain_type=clin_dict.get('Chest Pain'),
            risk_prediction="High" if pred == 1 else "Low",
            prediction_score=float(proba)
        )
        db.session.add(cp)
        db.session.commit()

        decision = {
            "level": level,
            "message": msg,
            "pred": pred,
            "proba": proba,
            "tips": tips,
        }

        profile = PatientProfile.query.filter_by(user_id=user.user_id).first()
        if profile:
            profile.clinical_tips = tips
            db.session.add(profile)
            db.session.commit()

    return render_template(
        "clinical_form.html",
        decision=decision,
        form_data=form,
        default_age=default_age
    )
@app.route('/api/patients/<username>/latest-lifestyle')
def latest_lifestyle(username):
    user = User.query.filter_by(username=username).first_or_404()
    profile = PatientProfile.query.filter_by(user_id=user.user_id).first()

    lp = (LifestylePrediction.query
          .filter_by(user_id=user.user_id)
          .order_by(LifestylePrediction.created_at.desc())
          .first())

    if not lp:
        return jsonify({"has_prediction": False})

    return jsonify({
        "has_prediction": True,
        "risk_prediction": lp.risk_prediction,
        "prediction_score": float(lp.prediction_score),
        "profile": {
            "name": user.full_name,
            "age": user.age,
            "patient_id": profile.patient_id if profile else None,
            "tips": profile.tips if profile and profile.tips else [],
            "clinical_tips": profile.clinical_tips if profile and profile.clinical_tips else []
        }
    })
@app.route('/api/patients/<username>/latest-clinical')
def latest_clinical(username):
    user = User.query.filter_by(username=username).first_or_404()
    profile = PatientProfile.query.filter_by(user_id=user.user_id).first()

    cp = (ClinicalPrediction.query
          .filter_by(user_id=user.user_id)
          .order_by(ClinicalPrediction.created_at.desc())
          .first())
    if not cp:
        return jsonify({"has_prediction": False})
    return jsonify({
        "has_prediction": True,
        "risk_prediction": cp.risk_prediction,
        "prediction_score": float(cp.prediction_score),
        "clinical_tips": profile.clinical_tips if profile and profile.clinical_tips else []
    })
@app.route('/api/patients/<username>/lifestyle-history')
def lifestyle_history(username):
    user = User.query.filter_by(username=username).first_or_404()
    rows = (LifestylePrediction.query
            .filter_by(user_id=user.user_id)
            .order_by(LifestylePrediction.created_at.desc())
            .all())
    return jsonify([
        {
            "created_at": row.created_at.isoformat(),
            "risk_prediction": row.risk_prediction,
            "prediction_score": float(row.prediction_score),
            "general_health": row.general_health,
            "exercise": row.exercise,
            "diabetes": row.diabetes,
            "age_category": row.age_category,
            "bmi": float(row.bmi) if row.bmi is not None else None,
            "smoking_history": row.smoking_history
        }
        for row in rows
    ])


@app.route('/api/patients/<username>/clinical-history')
def clinical_history(username):
    user = User.query.filter_by(username=username).first_or_404()
    rows = (ClinicalPrediction.query
            .filter_by(user_id=user.user_id)
            .order_by(ClinicalPrediction.created_at.desc())
            .all())
    return jsonify([
        {
            "created_at": row.created_at.isoformat(),
            "risk_prediction": row.risk_prediction,
            "prediction_score": float(row.prediction_score),
            "age_years": row.age_years,
            "resting_bp_systolic": row.resting_bp_systolic,
            "cholesterol_mg_dl": row.cholesterol_mg_dl,
            "max_heart_rate": row.max_heart_rate
        }
        for row in rows
    ])


@app.route('/api/labs', methods=['GET'])
def get_labs():
    rows = db.session.execute(text("""
        SELECT
          branch_code AS id,
          branch_name AS name,
          branch_code AS code,
          location,
          is_active,
          lat,
          lng
        FROM lab_branches
        ORDER BY branch_id ASC
    """)).mappings().all()

    return jsonify([dict(r) for r in rows])

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    print(">>> HIT /api/appointments, data =", request.json)

    data = request.json
    username = data.get('username')
    branch_code = data.get('branch_code')  # changed
    date_str = data.get('date')
    time_str = data.get('time')

    print(">>> username:", username, "branch_code:", branch_code)

    user = User.query.filter_by(username=username).first()
    if not user:
        print(">>> user not found!")
        return jsonify({"error": "User not found"}), 404

    branch = LabBranch.query.filter_by(branch_code=branch_code).first()
    if not branch:
        print(">>> branch not found!")
        return jsonify({"error": "Lab branch not found"}), 404

    try:
        appt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        appt_time = datetime.strptime(time_str, "%H:%M").time()
    except ValueError:
        return jsonify({"error": "Invalid date/time format"}), 400

    appt = Appointment(
        user_id=user.user_id,
        branch_id=branch.branch_id,
        appointment_date=appt_date,
        appointment_time=appt_time,
        status='Pending'
    )
    db.session.add(appt)
    db.session.commit()

    return jsonify({"success": True, "appointment_id": appt.appointment_id}), 201

@app.route('/api/lab/appointments')
def lab_appointments():
    rows = (
        db.session.query(
            Appointment.appointment_id,
            Appointment.appointment_date,
            Appointment.appointment_time,
            Appointment.status,
            User.full_name,
            User.age,
            PatientProfile.patient_id,
            LabBranch.branch_name,
        )
        .join(User, Appointment.user_id == User.user_id)
        .join(PatientProfile, PatientProfile.user_id == User.user_id)
        .join(LabBranch, Appointment.branch_id == LabBranch.branch_id)
        .order_by(Appointment.created_at.desc())
        .limit(20)
        .all()
    )

    appointments = [
        {
            "appointment_id": r.appointment_id,
            "date": r.appointment_date.isoformat(),
            "time": r.appointment_time.strftime("%H:%M"),
            "status": r.status,
            "patient_id": r.patient_id,
            "name": r.full_name,
            "age": r.age,
            "branch": r.branch_name,
        }
        for r in rows
    ]

    return jsonify({
        "appointments": appointments,
        "total_patients": len({r.patient_id for r in rows}),
        "pending_count": sum(1 for r in rows if r.status == "Pending"),
    })

@app.route("/lab")
def lab_page():
    return render_template("lab.html")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()  
    app.run(debug=True, port=5000)
