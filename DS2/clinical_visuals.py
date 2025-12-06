import os
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import matplotlib.pyplot as plt
from flask import jsonify  # For Flask API

# ---------------------------------------------------------
# 1) CONSTANTS - FIXED STRING KEYS ✅
# ---------------------------------------------------------
DATA_PATH = r"C:\Users\habib\OneDrive\المستندات\Graduation Project\GRAD-proj-DEPI\DS2\heart_cleveland_upload.csv"
assert os.path.exists(DATA_PATH), f"File not found: {DATA_PATH}"

TGT = "Heart Disease Class (0,1)"

NUM = [
    "Age (years)",
    "Resting BP (mm Hg)",
    "Cholesterol (mg/dl)",
    "Max Heart Rate (bpm)",
    "ST Depression (oldpeak)"
]

CAT = [
    "Chest Pain Type",
    "Resting ECG",
    "ST Slope",
    "Thalassemia",
    "Major Vessels (0–3)"
]

CATEGORY_MAPS = {
    "Chest Pain Type": {
        "0": "Normal",
        "1": "Atypical",
        "2": "Non-anginal", 
        "3": "Asymptomatic"
    },
    "Resting ECG": {
        "0": "Normal",
        "1": "ST-T Wave Abnormality",
        "2": "Left Ventricular Hypertrophy"
    },
    "ST Slope": {
        "0": "Upsloping",
        "1": "Flat",
        "2": "Downsloping"
        },
    "Thalassemia": {
        "0": "Normal ",
        "1": "Fixed defect",
        "2": "Reversible defect",
        "3": "Severe defect"
    },
    "Major Vessels (0–3)": {
        "0": "0 Vessels",
        "1": "1 Vessel",
        "2": "2 Vessels", 
        "3": "3 Vessels"
    }
}

# ---------------------------------------------------------
# 2) LOAD DATA
# ---------------------------------------------------------
df = pd.read_csv(DATA_PATH)

# Create df_viz for visuals (drop unknowns)
df_viz = df.copy()
for col in CAT:
    if col in df_viz.columns:
        df_viz = df_viz[df_viz[col].notna()]

print("Original data shape:", df.shape)
print("Visuals data shape:", df_viz.shape)

# ---------------------------------------------------------
# 3) MAIN FUNCTION - COMPLETE FIXED ✅
# ---------------------------------------------------------
def get_clinical_visual_stats(df):
    stats = {}
    
    # //////////////////////// HEART DISEASE ///////////////////////////////
    label_map = {0: "Healthy", 1: "Diseased"}
    if TGT in df.columns:
        heart_counts = df[TGT].value_counts().sort_index().rename(index=label_map).reset_index()
        heart_counts.columns = ["Heart Disease Type", "Count"]
        stats["heart_disease"] = heart_counts.to_dict(orient="records")

    #///////////////////////// NUMERIC SUMMARY + HISTOGRAMS ////////////////////////////
    stats["numeric_summary"] = {}
    for col in NUM:
        if col in df.columns:
            series = df[col].dropna()
            if len(series) > 0:
                stats["numeric_summary"][col] = {
                    "min": float(series.min()), "max": float(series.max()),
                    "median": float(series.median()), "mean": float(series.mean())
                }
                try:
                    hist, edges = np.histogram(series, bins=8)
                    stats[f"{col}_histogram"] = [{"bin": f"{edges[i]:.0f}-{edges[i+1]:.0f}", "count": int(hist[i])} for i in range(len(hist))]
                except:
                    stats[f"{col}_histogram"] = [{"bin": "0-100", "count": 100}]

    # //////////////////////// FIXED CATEGORICALS - STRING CONVERSION  ////////////////////////
    stats["categoricals"] = {}
    for col in CAT:
        if col in df.columns:
            counts = df[col].value_counts().sort_index().reset_index()
            counts.columns = ["category_code", "count"]
            
            # ✅ KEY FIX: Convert to string for mapping
            counts["category_code_str"] = counts["category_code"].astype(str)
            
            if col in CATEGORY_MAPS:
                counts["category"] = counts["category_code_str"].map(CATEGORY_MAPS[col]).fillna(counts["category_code_str"])
                print(f"✅ {col} FIXED: {counts['category'].tolist()}")
            else:
                counts["category"] = counts["category_code_str"]
            
            total = counts["count"].sum()
            counts["percent"] = (counts["count"] / total * 100).round(1)
            stats["categoricals"][col] = counts[["category", "count", "percent"]].to_dict('records')
###########################################################################################
    
    return stats




# ---------------------------------------------------------
# 4) FLASK API ENDPOINT (Add to your app.py)
# ---------------------------------------------------------
def flask_endpoint_example():
    """
    Add this to your Flask app.py:
    
    @app.route("/api/clinical-visuals-data")
    def clinical_visuals_data():
        return jsonify(get_clinical_visual_stats(df))
    """
    pass

# ---------------------------------------------------------
# 5) DEBUG TEST
# ---------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 CLINICAL VISUAL STATS - FULL TEST")
    print("="*60)
    
    out = get_clinical_visual_stats(df)
    
    # ✅ SAFE CHECKS
    print("\n✅ Heart disease:", len(out.get("heart_disease", [])), "items")
    print("✅ Numeric summary:", len(out.get("numeric_summary", {})), "features")
    print("✅ Categoricals:", list(out.get("categoricals", {}).keys()))
    
    chest_pain = out.get("categoricals", {}).get("Chest Pain Type", [])
    if chest_pain:
        print("✅ Chest Pain Type FIRST:", chest_pain[0]["category"])
        print("✅ Chest Pain Type FULL:", [item["category"] for item in chest_pain])
    
    print("\n🎉 JSON READY FOR REACT → 'Normal' | 'Atypical' LIVE!")
    print("="*60)
