# models.py
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime

db = SQLAlchemy()

# =====================================================
# 1. USERS TABLE
# =====================================================
class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    email = db.Column(db.String(100), unique=True)
    role = db.Column(db.String(20), default='patient')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = db.relationship('PatientProfile', backref='user', uselist=False)
    appointments = db.relationship('Appointment', backref='user')

# =====================================================
# 2. PATIENT PROFILES
# =====================================================
class PatientProfile(db.Model):
    __tablename__ = 'patient_profiles'

    profile_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), unique=True)
    patient_id = db.Column(db.String(20), unique=True, nullable=False)
    risk_level = db.Column(db.String(20), default='Low')
    last_checkup = db.Column(db.Date)
    tips = db.Column(ARRAY(db.String))               # keep for lifestyle
    clinical_tips = db.Column(ARRAY(db.String))      # NEW for clinical



# =====================================================
# 3. LAB BRANCHES
# =====================================================
class LabBranch(db.Model):
    __tablename__ = 'lab_branches'
    
    branch_id = db.Column(db.Integer, primary_key=True)
    branch_code = db.Column(db.String(50), unique=True, nullable=False)
    branch_name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    appointments = db.relationship('Appointment', backref='branch')
    lab_patients = db.relationship('LabPatient', backref='branch')

# =====================================================
# 4. APPOINTMENTS
# =====================================================
class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    appointment_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    branch_id = db.Column(db.Integer, db.ForeignKey('lab_branches.branch_id'))
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# =====================================================
# 5. SYSTEM STATS
# =====================================================
class SystemStat(db.Model):
    __tablename__ = 'system_stats'
    
    stat_id = db.Column(db.Integer, primary_key=True)
    stat_year = db.Column(db.Integer, unique=True, nullable=False)
    total_patients = db.Column(db.Integer)
    total_tests = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# =====================================================
# 6. STAGE 1 - LIFESTYLE PREDICTIONS (BRFSS)
# =====================================================
class LifestylePrediction(db.Model):
    __tablename__ = 'lifestyle_predictions'
    
    pred_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    general_health = db.Column(db.String(20))
    checkup = db.Column(db.String(50))
    exercise = db.Column(db.String(50))
    heart_disease = db.Column(db.Boolean, default=False)
    skin_cancer = db.Column(db.Boolean, default=False)
    other_cancer = db.Column(db.Boolean, default=False)
    depression = db.Column(db.Boolean, default=False)
    diabetes = db.Column(db.String(20))
    arthritis = db.Column(db.Boolean, default=False)
    sex = db.Column(db.String(10))
    age_category = db.Column(db.String(20))
    height_cm = db.Column(db.Numeric(5,1))
    weight_kg = db.Column(db.Numeric(5,1))
    bmi = db.Column(db.Numeric(5,2))
    smoking_history = db.Column(db.String(50))
    alcohol_consumption = db.Column(db.Numeric(5,2))
    fruit_consumption = db.Column(db.Numeric(5,2))
    green_veg_consumption = db.Column(db.Numeric(5,2))
    fried_potato_consumption = db.Column(db.Numeric(5,2))
    risk_prediction = db.Column(db.String(20))
    prediction_score = db.Column(db.Numeric(5,3))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# =====================================================
# 7. STAGE 2 - CLINICAL PREDICTIONS (Cleveland)
# =====================================================
class ClinicalPrediction(db.Model):
    __tablename__ = 'clinical_predictions'
    
    pred_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    age_years = db.Column(db.Integer)
    resting_bp_systolic = db.Column(db.Integer)
    resting_bp_diastolic = db.Column(db.Integer)
    cholesterol_mg_dl = db.Column(db.Integer)
    fasting_blood_sugar = db.Column(db.Integer)
    resting_ecg = db.Column(db.String(20))
    max_heart_rate = db.Column(db.Integer)
    exercise_angina = db.Column(db.Boolean)
    st_depression_oldpeak = db.Column(db.Numeric(4,2))
    st_slope = db.Column(db.String(20))
    major_vessels = db.Column(db.Integer)
    thalassemia = db.Column(db.String(20))
    chest_pain_type = db.Column(db.String(50))
    risk_prediction = db.Column(db.String(20))
    prediction_score = db.Column(db.Numeric(5,3))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# =====================================================
# 8. LAB PATIENTS
# =====================================================
class LabPatient(db.Model):
    __tablename__ = 'lab_patients'
    
    lab_patient_id = db.Column(db.Integer, primary_key=True)
    lab_branch_id = db.Column(db.Integer, db.ForeignKey('lab_branches.branch_id'))
    external_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# =====================================================
# 9. LAB USERS
# =====================================================
class LabUser(db.Model):
    __tablename__ = 'lab_users'
    
    lab_user_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'))
    branch_id = db.Column(db.Integer, db.ForeignKey('lab_branches.branch_id'))
    license_id = db.Column(db.String(50), unique=True, nullable=False)
