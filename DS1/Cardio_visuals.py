# -*- coding: utf-8 -*-
"""
Graduation Project - EDA helpers for Flask / React

This file NO LONGER runs plots on import.
It only provides functions to:
- load the dataset
- compute summary stats
- build specific Plotly figures if needed
"""

import pandas as pd
import plotly.express as px
import warnings
warnings.filterwarnings("ignore")

DATA_PATH = r"C:\Users\habib\OneDrive\المستندات\DEPI_GRAD_PROJECT\DS1\Cardiovascular Diseases Risk Prediction Dataset export 2025-10-15 21-12-56.csv"


# -------------------------------------------------
# Core loader
# -------------------------------------------------
def load_cardio_df(path: str = DATA_PATH) -> pd.DataFrame:
    """Load full dataset once when called (not at import)."""
    df = pd.read_csv(path)
    return df


# -------------------------------------------------
# Small stats for React (JSON‑friendly)
# -------------------------------------------------
def get_visual_stats(path: str = DATA_PATH) -> dict:
    """
    Return lightweight stats for React / APIs.
    Does NOT create any figures.
    """
    df = load_cardio_df(path)
    stats = {}

    # 1) Heart disease yes / no
    if "Heart_Disease" in df.columns:
        stats["heart_disease"] = df["Heart_Disease"].value_counts().to_dict()

    # 2) General health categories
    if "General_Health" in df.columns:
        stats["general_health"] = df["General_Health"].value_counts().to_dict()

    # 3) Age x Heart Disease
    if {"Age_Category", "Heart_Disease"}.issubset(df.columns):
        age_hd = (
            df.groupby(["Age_Category", "Heart_Disease"])
              .size()
              .reset_index(name="Count")
        )
        stats["age_disease"] = age_hd.to_dict(orient="records")

    # 4) Diabetes yes / no
    if "Diabetes" in df.columns:
        stats["diabetes"] = df["Diabetes"].value_counts().to_dict()

    # 5) BMI mean by exercise
    if {"BMI", "Exercise"}.issubset(df.columns):
        bmi_ex = (
            df.groupby("Exercise")["BMI"]
              .agg(["mean"])
              .round(1)
              .reset_index()
        )
        stats["bmi_exercise"] = bmi_ex.to_dict(orient="records")

    # 6) Sex distribution
    if "Sex" in df.columns:
        stats["sex"] = df["Sex"].value_counts().to_dict()

    # 7) Average alcohol consumption by exercise
    if {"Alcohol_Consumption", "Exercise"}.issubset(df.columns):
        alc_ex = (
            df.groupby("Exercise")["Alcohol_Consumption"]
              .mean()
              .round(2)
              .reset_index()
        )
        stats["alcohol_exercise"] = alc_ex.to_dict(orient="records")

    return stats

# -------------------------------------------------
# Optional: Build individual Plotly figures (no .show())
# You can still use these in a Flask template if needed.
# -------------------------------------------------
def fig_heart_disease(df: pd.DataFrame):
    if "Heart_Disease" not in df.columns:
        return None
    fig = px.pie(
        df,
        names="Heart_Disease",
        title="Heart Disease Status Distribution",
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Set3,
    )
    fig.update_traces(textposition="inside", textinfo="percent+label")
    fig.update_layout(title_x=0.5, template="plotly_white")
    return fig


def fig_general_health(df: pd.DataFrame):
    if "General_Health" not in df.columns:
        return None
    fig = px.pie(
        df,
        names="General_Health",
        title="General Health Proportions",
        hole=0.3,
        color_discrete_sequence=px.colors.qualitative.Pastel,
    )
    fig.update_traces(textposition="inside", textinfo="percent+label")
    fig.update_layout(title_x=0.5, template="plotly_white")
    return fig


def fig_age_vs_hd(df: pd.DataFrame):
    if {"Age_Category", "Heart_Disease"}.issubset(df.columns) is False:
        return None
    age_hd = (
        df.groupby(["Age_Category", "Heart_Disease"])
          .size()
          .reset_index(name="Count")
    )
    fig = px.bar(
        age_hd,
        x="Age_Category",
        y="Count",
        color="Heart_Disease",
        barmode="group",
        title="Heart Disease Cases per Age Group",
        color_discrete_sequence=px.colors.qualitative.Safe,
    )
    fig.update_layout(
        xaxis_title="Age Group",
        yaxis_title="Number of Patients",
        template="plotly_white",
        title_x=0.5,
    )
    return fig
