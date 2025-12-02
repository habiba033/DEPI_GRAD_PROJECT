# -*- coding: utf-8 -*-
"""
Graduation Project - Stage 1B: Exploratory Data Analysis (EDA)
Goal: Explore lifestyle and general health factors influencing Heart Disease.
"""

# ===============================================================
#  Import Libraries
# ===============================================================

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import warnings
warnings.filterwarnings('ignore')

# Visualization style setup
plt.style.use('seaborn-v0_8')
sns.set_palette('husl')

# ===============================================================
# Load Dataset
# ===============================================================
df = pd.read_csv(r"C:\Users\habib\OneDrive\المستندات\Graduation Project\GRAD-proj-DEPI\Cardio_Notebook\Cardiovascular Diseases Risk Prediction Dataset export 2025-10-15 21-12-56.csv")

print(f"✅ Dataset Loaded. Shape: {df.shape}")
print(df.head())

# ===============================================================
#  Target Variable Exploration
# ===============================================================

# Heart Disease Distribution
fig = px.pie(
    df, names='Heart_Disease',
    title='Heart Disease Status Distribution',
    hole=0.4,
    color_discrete_sequence=px.colors.qualitative.Set3
)
fig.update_traces(textposition='inside', textinfo='percent+label')
fig.update_layout(title_x=0.5, template='plotly_white')
fig.show()

# ===============================================================
# ===============================================================
# ***** Univariate exploration ******
# ===============================================================
# ===============================================================

# ===============================================================
#  General Health Distribution
# ===============================================================
if 'General_Health' in df.columns:
    fig = px.pie(
        df, names='General_Health',
        title='General Health Proportions',
        hole=0.3,
        color_discrete_sequence=px.colors.qualitative.Pastel
    )
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(title_x=0.5, template='plotly_white')
    fig.show()

# ===============================================================
# Medical Checkup Frequency
# ===============================================================
if 'Checkup' in df.columns:
    checkup_counts = df['Checkup'].value_counts().sort_index().reset_index()
    checkup_counts.columns = ['Checkup Interval', 'Count']

    fig = px.line(
        checkup_counts,
        x='Checkup Interval', y='Count',
        title='Medical Checkup Frequency Among Patients',
        markers=True,
        color_discrete_sequence=['#1f77b4']
    )
    fig.update_traces(
        mode='lines+markers',
        hovertemplate='Checkup Interval: %{x}<br>Patient Count: %{y}'
    )
    fig.update_layout(
        xaxis_title='Checkup Interval',
        yaxis_title='Number of Patients',
        template='plotly_white',
        title_x=0.5
    )
    fig.show()

# ===============================================================
# Age Category vs Heart Disease
# ===============================================================
if {'Age_Category', 'Heart_Disease'}.issubset(df.columns):
    age_hd = df.groupby(['Age_Category', 'Heart_Disease']).size().reset_index(name='Count')

    fig = px.bar(
        age_hd,
        x='Age_Category', y='Count', color='Heart_Disease',
        barmode='group',
        title='Heart Disease Cases per Age Group',
        color_discrete_sequence=px.colors.qualitative.Safe,
        hover_data={'Age_Category': True, 'Heart_Disease': True, 'Count': True}
    )
    fig.update_layout(
        xaxis_title='Age Group',
        yaxis_title='Number of Patients',
        template='plotly_white',
        title_x=0.5
    )
    fig.show()

# ===============================================================
# Diabetes Frequency
# ===============================================================
if 'Diabetes' in df.columns:
    diabetes_freq = df['Diabetes'].value_counts().reset_index()
    diabetes_freq.columns = ['Diabetes Status', 'Count']

    fig = px.pie(
        diabetes_freq,
        names='Diabetes Status',
        values='Count',
        title='Patient Diabetes Status Frequency',
        hole=0.3,
        color_discrete_sequence=px.colors.qualitative.Pastel
    )
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(title_x=0.5, template='plotly_white')
    fig.show()

# ===============================================================
# Sex Distribution
# ===============================================================
if 'Sex' in df.columns:
    sex_freq = df['Sex'].value_counts().reset_index()
    sex_freq.columns = ['Sex', 'Count']

    fig = px.bar(
        sex_freq, x='Count', y='Sex',
        orientation='h',
        color='Sex',
        title='Sex Distribution in Dataset',
        color_discrete_sequence=["#2e86de", "#54a0ff"],
        hover_data={'Sex': True, 'Count': True}
    )
    fig.update_traces(hovertemplate='Sex: %{y}<br>Count: %{x}')
    fig.update_layout(
        xaxis_title='Count',
        yaxis_title='Sex',
        template='plotly_white',
        title_x=0.5
    )
    fig.show()

# ===============================================================
# Binary (Yes/No) Feature Proportions
# ===============================================================

binary_cols = [
    "Exercise", "Heart_Disease", "Skin_Cancer", "Other_Cancer",
    "Depression", "Arthritis", "Smoking_History"
]

prop_df = pd.DataFrame()
for col in binary_cols:
    if col in df.columns:
        total = len(df)
        counts = df[col].value_counts().rename('Count')
        norm = (counts / total * 100).rename('Percent')
        temp = pd.DataFrame({
            'Feature': col,
            'Response': counts.index,
            'Count': counts.values,
            'Percent': norm.values
        })
        prop_df = pd.concat([prop_df, temp], ignore_index=True)

pivot = prop_df.pivot(index='Feature', columns='Response', values='Percent').fillna(0)

fig = px.bar(
    pivot,
    orientation='h',
    barmode='stack',
    title='Proportion of Binary Responses Across Features',
    labels={"value": "Percent (%)", "Feature": "Feature"},
    color_discrete_sequence=["#1E88E5", "#90CAF9"]
)
fig.update_traces(hovertemplate='%{y} - %{legendgroup}: %{x:.1f}%')
fig.update_layout(
    xaxis_title='Percent (%)',
    yaxis_title='Feature',
    template='plotly_white',
    legend_title_text='Response',
    legend=dict(itemsizing='trace', font=dict(size=14)),
    title_x=0.5
)
fig.show()

# ===============================================================
# Numeric Feature Distributions
# ===============================================================

num_cols = [
    'Height_(cm)', 'Weight_(kg)', 'BMI',
    'Alcohol_Consumption', 'Fruit_Consumption',
    'Green_Vegetables_Consumption', 'FriedPotato_Consumption'
]

# --- Static overview (Seaborn)
plt.figure(figsize=(15, 10))
for i, col in enumerate(num_cols, 1):
    if col in df.columns:
        plt.subplot(4, 2, i)
        sns.histplot(df[col], kde=True, color='#0077b6')
        plt.title(f'Distribution of {col}')
plt.tight_layout()
plt.show()

# --- Interactive Plotly distributions
for col in num_cols:
    if col in df.columns:
        fig = px.histogram(
            df, x=col, nbins=30,
            title=f"Distribution of {col}",
            text_auto=True,
            marginal="box",
            color_discrete_sequence=["#118ab2"],
            hover_data={col: True}
        )
        fig.update_layout(template='plotly_white', title_x=0.5)
        fig.show()

# ===============================================================
# ===============================================================
# ***** Bivariate exploration ******
# ===============================================================
# ===============================================================

# ===============================================================
# BMI vs Exercise
# ===============================================================
if {'BMI', 'Exercise'}.issubset(df.columns):
    fig = px.box(
        df, x="Exercise", y="BMI", color="Exercise",
        points="all",
        title="BMI Distribution by Exercise Habits",
        color_discrete_sequence=px.colors.sequential.Blues
    )
    fig.update_layout(template='plotly_white', title_x=0.5)
    fig.show()

# ===============================================================
# Numeric vs Heart Disease Comparison
# ===============================================================
if 'Heart_Disease' in df.columns:
    for col in num_cols:
        if col in df.columns:
            fig = px.box(
                df, x="Heart_Disease", y=col, color="Heart_Disease",
                points="all",
                title=f"{col} by Heart Disease Status",
                color_discrete_sequence=px.colors.sequential.Blues
            )
            fig.update_traces(boxmean=True, jitter=0.25)
            fig.update_layout(
                template="plotly_white",
                xaxis_title="Heart Disease",
                yaxis_title=col,
                title_x=0.5
            )
            fig.show()


# ===============================================================
# ===============================================================
# ***** Multivariate exploration ******
# ===============================================================
# ===============================================================

# ---------------------------------------------------------------
# Heart Disease by Age Group and Sex (stacked bar)
# ---------------------------------------------------------------
if {'Age_Category', 'Sex', 'Heart_Disease'}.issubset(df.columns):
    age_sex_hd = df.groupby(['Age_Category', 'Sex', 'Heart_Disease']).size().reset_index(name='Count')

    fig = px.bar(
        age_sex_hd,
        x='Age_Category', y='Count',
        color='Sex',
        facet_col='Heart_Disease',
        title='Heart Disease Distribution by Age and Sex',
        color_discrete_sequence=px.colors.qualitative.Vivid
    )
    fig.update_layout(template='plotly_white', title_x=0.5)
    fig.show()

# ---------------------------------------------------------------
# BMI, Exercise, and Heart Disease (3D Scatter)
# ---------------------------------------------------------------
if {'BMI', 'Alcohol_Consumption', 'Heart_Disease'}.issubset(df.columns):
    fig = px.scatter_3d(
        df,
        x='BMI',
        y='Alcohol_Consumption',
        z='Fruit_Consumption',
        color='Heart_Disease',
        symbol='Exercise',
        title='3D View: BMI, Alcohol, and Fruit Consumption vs Heart Disease',
        color_discrete_map={0:'#5DADE2', 1:'#E74C3C'},
        opacity=0.7
    )
    fig.update_layout(template='plotly_white', title_x=0.5)
    fig.show()

# ---------------------------------------------------------------
# Pairwise relationships (correlation between numerics)
# ---------------------------------------------------------------
num_cols = [
    'Height_(cm)', 'Weight_(kg)', 'BMI',
    'Alcohol_Consumption', 'Fruit_Consumption',
    'Green_Vegetables_Consumption', 'FriedPotato_Consumption'
]
numeric_df = df[num_cols + ['Heart_Disease']].dropna()

sns.pairplot(
    numeric_df,
    hue='Heart_Disease',
    palette=['#3498DB', '#E74C3C'],
    diag_kind='kde',
    plot_kws={'alpha':0.6}
)
plt.suptitle("Pairwise Relationships Between Key Lifestyle Features", y=1.02)
plt.show()

# ---------------------------------------------------------------
# Correlation Heatmap (numerical + encoded target)
# ---------------------------------------------------------------
corr = numeric_df.corr()
plt.figure(figsize=(10,8))
sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f")
plt.title("Correlation Matrix - Numeric Variables", fontsize=14, pad=15)
plt.show()

# ---------------------------------------------------------------
#  Parallel Coordinates Plot (multi-feature pattern visualization)
# ---------------------------------------------------------------
from pandas.plotting import parallel_coordinates

selected_features = [
    'General_Health', 'Exercise', 'Smoking_History', 'Alcohol_Consumption',
    'Fruit_Consumption', 'BMI', 'Heart_Disease'
]
subset_df = df[selected_features].dropna()

# Encode categories temporarily for plotting
subset_df['General_Health'] = subset_df['General_Health'].replace({
    'Excellent':5, 'Very Good':4, 'Good':3, 'Fair':2, 'Poor':1
})
subset_df['Exercise'] = subset_df['Exercise'].map({'Yes':1, 'No':0})
subset_df['Smoking_History'] = subset_df['Smoking_History'].map({'Yes':1, 'No':0})

plt.figure(figsize=(12,6))
parallel_coordinates(subset_df, class_column='Heart_Disease', colormap=plt.cm.cool)
plt.title("Parallel Coordinates: Multi-Feature Relationship with Heart Disease", fontsize=14)
plt.ylabel("Scaled Values (approx.)")
plt.show()

# ---------------------------------------------------------------
# Grouped Heatmap (Lifestyle Risk Factors vs Heart Disease)
# ---------------------------------------------------------------
if {'Exercise', 'Smoking_History', 'Alcohol_Consumption'}.issubset(df.columns):
    risk_table = df.groupby(['Exercise', 'Smoking_History', 'Heart_Disease']) \
                   .size().reset_index(name='Count')
    pivot = risk_table.pivot_table(
        index=['Exercise', 'Smoking_History'],
        columns='Heart_Disease',
        values='Count', fill_value=0
    )
    plt.figure(figsize=(8,5))
    sns.heatmap(pivot, annot=True, cmap='YlGnBu', fmt='d')
    plt.title("Heart Disease Counts by Exercise & Smoking Status", fontsize=13)
    plt.show()

print(" EDA Completed Successfully.")
