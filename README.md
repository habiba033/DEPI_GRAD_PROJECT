# DEPI_GRAD_PROJECT
Dual‑Stage Deep Intelligence System for Cardiovascular Risk  This repository contains the source code and experiments for a two‑stage, AI‑powered heart disease risk assessment system. The project combines lifestyle‑based risk estimation with a clinical assessment model and exposes both through an integrated Flask web application.

# What this project does
Stage 1: Lifestyle model that estimates cardiovascular risk from demographic and behavioral factors (age category, BMI, exercise, smoking, alcohol, diet, diabetes, general health).

Stage 2: Clinical model that refines the risk using medical measurements (blood pressure, cholesterol, ECG‑related features, heart rate, ST‑segment data, etc.).

Integrated decision logic that mimics a “second opinion”: Stage 2 can automatically trigger for higher‑risk, older users, and the final outputs provide clear, interpretable recommendations.

# Tech stack
Python, pandas, NumPy, scikit‑learn, XGBoost / classical ML

Flask + Jinja2 templates

Tailwind CSS for responsive UI

Jupyter notebooks for EDA, model training, and visualization

# Main components
DS1/ – lifestyle model notebooks and cardio_predict.py (feature engineering, prediction, lifestyle tips).

DS2/ – clinical model notebooks and clinical_predict.py (feature mapping, prediction, clinical recommendations).

flask_app.py – web app routes for Stage 1, Stage 2, and integrated decision flow.

templates/ – UI pages for lifestyle form, clinical form, and visual analytics.

static/ – CSS, images, and generated visualizations.



Start the web app with python flask_app.py.

Open http://127.0.0.1:5000 in a browser to use the two‑stage risk assessment interface.
