import os
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import matplotlib.pyplot as plt

# ---------------------------------------------------------
# 1) CONSTANTS
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

# ---------------------------------------------------------
# 2) LOAD DATA
# ---------------------------------------------------------
df = pd.read_csv(DATA_PATH)

plt.rcParams.update({
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.edgecolor": "#222",
    "axes.labelcolor": "#222",
    "xtick.color": "#222",
    "ytick.color": "#222",
    "font.size": 11,
    "axes.grid": True,
    "grid.color": "#eee",
    "axes.titleweight": "bold"
})

print("Original data shape:", df.shape)

# ---------------------------------------------------------
# 3) MAIN FUNCTION
# ---------------------------------------------------------
def get_clinical_visual_stats(df):
    """
    Compute the statistics used for the Clinical Insights dashboard:
      ✔ Heart disease distribution
      ✔ Numeric summary stats (min/max/median/mean)
      ✔ Categorical distributions (counts / %)
      ✔ Correlation matrix for numeric features
    """

    # -----------------------------------------------------
    # CLEAN COPY (remove Unknown for visuals only)
    # -----------------------------------------------------
    df_viz = df.copy()
    for c in CAT:
        if c in df_viz.columns:
            df_viz = df_viz[df_viz[c].astype(str).str.lower() != "unknown"]

    stats = {}

    # -----------------------------------------------------
    # HEART DISEASE PIE DATA
    # -----------------------------------------------------
    # -----------------------------------------------------
# HEART DISEASE PIE DATA
# -----------------------------------------------------
    label_map = {0: "No Disease (0)", 1: "Disease (1)"}

    if TGT in df_viz.columns:
        heart_counts = (
        df_viz[TGT]
        .value_counts(dropna=False)
        .sort_index()
        .rename(index=label_map)          # map 0/1 → readable labels
        .reset_index()
    )

    # Match the visual-style naming
        heart_counts.columns = ["Heart Disease Type", "Count"]

    # Ensure Count is numeric
        heart_counts["Count"] = (
        pd.to_numeric(heart_counts["Count"], errors="coerce")
        .fillna(0)
        .astype(int)
    )

        total = heart_counts["Count"].sum()
        heart_counts["Percent"] = (
        (heart_counts["Count"] / total * 100).round(1) if total else 0.0
    )

    # For the API: list of dicts with the same keys the visual code expects
        stats["heart_disease"] = heart_counts.to_dict(orient="records")
    else:
        stats["heart_disease"] = []


    # -----------------------------------------------------
    # NUMERIC SUMMARY CARDS
    # -----------------------------------------------------
    num_stats = {}
    for col in NUM:
        if col in df_viz.columns:
            series = df_viz[col].dropna()
            if len(series) == 0:
                num_stats[col] = {"min": None, "max": None, "median": None, "mean": None}
            else:
                num_stats[col] = {
                    "min": float(series.min()),
                    "max": float(series.max()),
                    "median": float(series.median()),
                    "mean": float(series.mean()),
                }

    stats["numeric_summary"] = num_stats



    # -----------------------------------------------------
    # CATEGORICAL DISTRIBUTIONS
    # -----------------------------------------------------
    cat_stats = {}
    for col in CAT:
        if col in df_viz.columns:
            counts = (
                df_viz[col]
                .astype(str)
                .value_counts(dropna=False)
                .sort_index()
                .reset_index()
            )
            counts.columns = ["category", "count"]

            counts["count"] = (
                pd.to_numeric(counts["count"], errors="coerce")
                .fillna(0).astype(int)
            )

            total = counts["count"].sum()
            counts["percent"] = (
                (counts["count"] / total * 100).round(1) if total else 0.0
            )

            cat_stats[col] = counts.to_dict(orient="records")

    stats["categoricals"] = cat_stats

    # -----------------------------------------------------
    # CORRELATION MATRIX
    # -----------------------------------------------------
    numeric_cols = [c for c in NUM if c in df_viz.columns]

    if len(numeric_cols) > 1:
        corr = df_viz[numeric_cols].corr(numeric_only=True).round(2)
        stats["correlation"] = {
            "columns": corr.columns.tolist(),
            "matrix": corr.values.tolist(),
        }
    else:
        stats["correlation"] = {"columns": [], "matrix": []}

    return stats


# ---------------------------------------------------------
# 4) DEBUG TEST (REMOVE IN PRODUCTION)
# ---------------------------------------------------------
if __name__ == "__main__":
    print("\nClinical Visual Stats Preview:\n")
    out = get_clinical_visual_stats(df)
    for k in out:
        print(f"✔ {k} → OK")
