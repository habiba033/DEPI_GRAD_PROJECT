# DS1/Cardio_visuals.py
import pandas as pd
import plotly.express as px
import seaborn as sns
import matplotlib.pyplot as plt
import os

BASE_DIR = os.path.dirname(__file__)
df = pd.read_csv(os.path.join(BASE_DIR, "Cardiovascular_Diseases_Risk_Prediction.csv"))

VIS_DIR = os.path.join(BASE_DIR, "..", "static", "visuals")
os.makedirs(VIS_DIR, exist_ok=True)

def plot_heart_disease_pie():
    fig = px.pie(
        df, names="Heart_Disease",
        title="Heart Disease Status Distribution",
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Set3
    )
    fig.write_image(os.path.join(VIS_DIR, "heart_disease_pie.png"))

def plot_age_vs_hd():
    age_hd = df.groupby(["Age_Category", "Heart_Disease"]).size().reset_index(name="Count")
    fig = px.bar(
        age_hd,
        x="Age_Category", y="Count", color="Heart_Disease",
        barmode="group",
        title="Heart Disease Cases per Age Group",
        color_discrete_sequence=px.colors.qualitative.Safe,
    )
    fig.write_image(os.path.join(VIS_DIR, "age_hd_bar.png"))

def plot_bmi_alcohol_fruit_3d():
    fig = px.scatter_3d(
        df,
        x="BMI", y="Alcohol_Consumption", z="Fruit_Consumption",
        color="Heart_Disease", symbol="Exercise",
        title="BMI, Alcohol & Fruit vs Heart Disease",
        color_discrete_map={0: "#5DADE2", 1: "#E74C3C"},
        opacity=0.7,
    )
    fig.write_image(os.path.join(VIS_DIR, "bmi_alcohol_fruit_3d.png"))

def generate_all_visuals():
    plot_heart_disease_pie()
    plot_age_vs_hd()
    plot_bmi_alcohol_fruit_3d()

