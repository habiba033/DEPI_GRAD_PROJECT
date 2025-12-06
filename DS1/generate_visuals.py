"""
Graduation Project - Generate ALL Visuals for Flask Dashboard
Saves every plot from Cardio_visuals.py as PNG in static/visuals/
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import warnings
warnings.filterwarnings('ignore')

from pathlib import Path
import kaleido  # pip install kaleido

# Setup
plt.style.use('seaborn-v0_8')
sns.set_palette('husl')

# Create static/visuals directory
VIS_DIR = Path("static/visuals")
VIS_DIR.mkdir(parents=True, exist_ok=True)

print("📊 Generating ALL visuals for Flask dashboard...")

# Load Dataset (UPDATE YOUR PATH)
df = pd.read_csv(r"C:\Users\habib\OneDrive\المستندات\DEPI_GRAD_PROJECT\DS1\Cardiovascular Diseases Risk Prediction Dataset export 2025-10-15 21-12-56.csv")

print(f"✅ Dataset loaded: {df.shape}")

# =====================================================
# 1. HEART DISEASE PIE (Dashboard Hero)
# =====================================================
fig = px.pie(df, names='Heart_Disease', hole=0.4, title='Heart Disease Distribution',
             color_discrete_sequence=px.colors.qualitative.Set3)
fig.update_traces(textposition='inside', textinfo='percent+label')
fig.update_layout(title_x=0.5, template='plotly_white', width=600, height=400)
fig.write_image(VIS_DIR / "01_heart_disease_pie.png")
print("✅ 01_heart_disease_pie.png")

# =====================================================
# 2. GENERAL HEALTH PIE (Dashboard Key Visual)
# =====================================================
if 'General_Health' in df.columns:
    fig = px.pie(df, names='General_Health', hole=0.3, title='General Health Distribution',
                 color_discrete_sequence=px.colors.qualitative.Pastel)
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(title_x=0.5, template='plotly_white', width=600, height=400)
    fig.write_image(VIS_DIR / "02_general_health_pie.png")
    print("✅ 02_general_health_pie.png")

# =====================================================
# 3. AGE vs HEART DISEASE BAR (Critical Insight)
# =====================================================
if {'Age_Category', 'Heart_Disease'}.issubset(df.columns):
    age_hd = df.groupby(['Age_Category', 'Heart_Disease']).size().reset_index(name='Count')
    fig = px.bar(age_hd, x='Age_Category', y='Count', color='Heart_Disease', barmode='group',
                 title='Heart Disease by Age Group', color_discrete_sequence=px.colors.qualitative.Safe)
    fig.update_layout(template='plotly_white', width=800, height=400, title_x=0.5)
    fig.write_image(VIS_DIR / "03_age_hd_bar.png")
    print("✅ 03_age_hd_bar.png")

# =====================================================
# 4. DIABETES PIE
# =====================================================
if 'Diabetes' in df.columns:
    diabetes_freq = df['Diabetes'].value_counts().reset_index()
    diabetes_freq.columns = ['Diabetes Status', 'Count']
    fig = px.pie(diabetes_freq, names='Diabetes Status', values='Count', hole=0.3,
                 title='Diabetes Status', color_discrete_sequence=px.colors.qualitative.Pastel)
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(title_x=0.5, template='plotly_white', width=500, height=400)
    fig.write_image(VIS_DIR / "04_diabetes_pie.png")
    print("✅ 04_diabetes_pie.png")

# =====================================================
# 5. SEX DISTRIBUTION HORIZONTAL BAR
# =====================================================
if 'Sex' in df.columns:
    sex_freq = df['Sex'].value_counts().reset_index()
    sex_freq.columns = ['Sex', 'Count']
    fig = px.bar(sex_freq, x='Count', y='Sex', orientation='h', color='Sex',
                 title='Sex Distribution', color_discrete_sequence=["#2e86de", "#54a0ff"])
    fig.update_layout(template='plotly_white', width=500, height=400, title_x=0.5)
    fig.write_image(VIS_DIR / "05_sex_bar.png")
    print("✅ 05_sex_bar.png")

# =====================================================
# 6. BINARY FEATURES STACKED BAR
# =====================================================
binary_cols = ["Exercise", "Heart_Disease", "Skin_Cancer", "Other_Cancer", "Depression", "Arthritis", "Smoking_History"]
prop_df = pd.DataFrame()
for col in binary_cols:
    if col in df.columns:
        total = len(df)
        counts = df[col].value_counts().rename('Count')
        norm = (counts / total * 100).rename('Percent')
        temp = pd.DataFrame({'Feature': col, 'Response': counts.index, 'Percent': norm.values})
        prop_df = pd.concat([prop_df, temp], ignore_index=True)

pivot = prop_df.pivot(index='Feature', columns='Response', values='Percent').fillna(0)
fig = px.bar(pivot, orientation='h', barmode='stack', title='Binary Feature Proportions',
             color_discrete_sequence=["#1E88E5", "#90CAF9"])
fig.update_layout(template='plotly_white', width=700, height=500, title_x=0.5)
fig.write_image(VIS_DIR / "06_binary_stacked.png")
print("✅ 06_binary_stacked.png")

# =====================================================
# 7. BMI vs EXERCISE BOXPLOT
# =====================================================
if {'BMI', 'Exercise'}.issubset(df.columns):
    fig = px.box(df, x="Exercise", y="BMI", color="Exercise", points="all",
                 title="BMI by Exercise Habits", color_discrete_sequence=px.colors.sequential.Blues)
    fig.update_layout(template='plotly_white', width=600, height=400, title_x=0.5)
    fig.write_image(VIS_DIR / "07_bmi_exercise_box.png")
    print("✅ 07_bmi_exercise_box.png")

# =====================================================
# 8. CHECKUP FREQUENCY LINE
# =====================================================
if 'Checkup' in df.columns:
    checkup_counts = df['Checkup'].value_counts().sort_index().reset_index()
    checkup_counts.columns = ['Checkup Interval', 'Count']
    fig = px.line(checkup_counts, x='Checkup Interval', y='Count', markers=True,
                  title='Medical Checkup Frequency', color_discrete_sequence=['#1f77b4'])
    fig.update_layout(template='plotly_white', width=700, height=400, title_x=0.5)
    fig.write_image(VIS_DIR / "08_checkup_line.png")
    print("✅ 08_checkup_line.png")

# =====================================================
# 9. CORRELATION HEATMAP (Matplotlib -> PNG)
# =====================================================
num_cols = ['Height_(cm)', 'Weight_(kg)', 'BMI', 'Alcohol_Consumption', 'Fruit_Consumption',
            'Green_Vegetables_Consumption', 'FriedPotato_Consumption']
numeric_df = df[num_cols + ['Heart_Disease']].dropna()
corr = numeric_df.corr()
plt.figure(figsize=(10,8))
sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f", center=0)
plt.title("Correlation Matrix - Lifestyle Factors")
plt.tight_layout()
plt.savefig(VIS_DIR / "09_correlation_heatmap.png", dpi=300, bbox_inches='tight')
plt.close()
print("✅ 09_correlation_heatmap.png")

# =====================================================
# 10. AGE-SEX-HEART DISEASE FACET BAR
# =====================================================
if {'Age_Category', 'Sex', 'Heart_Disease'}.issubset(df.columns):
    age_sex_hd = df.groupby(['Age_Category', 'Sex', 'Heart_Disease']).size().reset_index(name='Count')
    fig = px.bar(age_sex_hd, x='Age_Category', y='Count', color='Sex', facet_col='Heart_Disease',
                 title='Heart Disease by Age & Sex', color_discrete_sequence=px.colors.qualitative.Vivid)
    fig.update_layout(template='plotly_white', width=1000, height=400, title_x=0.5)
    fig.write_image(VIS_DIR / "10_age_sex_facet.png")
    print("✅ 10_age_sex_facet.png")

# =====================================================
# 11-17. NUMERIC DISTRIBUTIONS (Sample 3 key ones)
# =====================================================
key_num_cols = ['BMI', 'Alcohol_Consumption', 'Fruit_Consumption']
for i, col in enumerate(key_num_cols, 11):
    if col in df.columns:
        fig = px.histogram(df, x=col, nbins=30, title=f"{col} Distribution",
                          marginal="box", color_discrete_sequence=["#118ab2"])
        fig.update_layout(template='plotly_white', width=600, height=400, title_x=0.5)
        fig.write_image(VIS_DIR / f"{i:02d}_{col.lower().replace('_(cm)', '').replace('_(kg)', '')}_hist.png")
        print(f"✅ {i:02d}_{col.lower()}_hist.png")

print("🎉 ALL VISUALS GENERATED SUCCESSFULLY!")
print(f"📁 Saved to: {VIS_DIR.absolute()}")
print("🔗 Now update your visuals_lifestyle.html with these filenames!")

