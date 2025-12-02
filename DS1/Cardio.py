'''
GOAL : Build a binary classification model that predicts whether a person
is at risk of heart disease based on lifestyle and general health factors.
Target column → Heart_Disease
'''
#I mport Liberaries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.subplots as sp
import plotly.graph_objects as go
import warnings
warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
import joblib, json, os
from pathlib import Path
from packaging import version
import sklearn
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score, f1_score,
    confusion_matrix, classification_report, brier_score_loss, RocCurveDisplay, PrecisionRecallDisplay
)
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
np.set_printoptions(suppress=True)
plt.rcParams["figure.dpi"] = 120


#read the dataset
df= pd.read_csv(r"C:\Users\habib\OneDrive\المستندات\Graduation Project\GRAD-proj-DEPI\Cardio_Notebook\Cardiovascular Diseases Risk Prediction Dataset export 2025-10-15 21-12-56.csv")
print(df.head())
print("Shape:", df.shape)
print("\nData types:\n", df.dtypes)
print(df.describe())


#define categories
CAT = [c for c in [
    "General_Health","Checkup","Exercise","Skin_Cancer","Other_Cancer",
    "Depression","Diabetes","Arthritis","Sex","Age_Category","Smoking_History",
    "BMI_Category" 
] if c in df.columns]

NUM = [c for c in [
    "Height_(cm)","Weight_(kg)","BMI",
    "Alcohol_Consumption","Fruit_Consumption",
    "Green_Vegetables_Consumption","FriedPotato_Consumption"
] if c in df.columns]
TARGET = "Heart_Disease"

print("CAT:", CAT)
print("NUM:", NUM)
print("Target:", TARGET)

#Check missing values
miss = df[CAT + NUM].isna().mean().sort_values(ascending=False)
print("Missingness (%):\n", (miss*100).round(2))

#full-row duplicates
dup_count = df.duplicated().sum()
print("Full-row duplicates:", dup_count)
df_eda = df.drop_duplicates()

#Clean Categorical Values
for c in CAT:
    df_eda[c] = df_eda[c].astype(str).str.strip().str.title()


###################################################
'''
EDA Stage in visuals.py
'''
##################################################



#Ensure target is numeric 0/1
if df[TARGET].dtype=="O":
    df[TARGET] = df[TARGET].map({"Yes":1,"No":0}).astype(int)

X = df[CAT + NUM].copy()
y = df[TARGET].copy()


# BMI Category - WHO Standard (6 Classes)
def encode_bmi(bmi):
    if bmi < 18.5:
        return 'Underweight'
    elif bmi < 25:
        return 'Normal'
    elif bmi < 30:
        return 'Overweight'
    elif bmi < 35:
        return 'Obesity Class I'
    elif bmi < 40:
        return 'Obesity Class II'
    else:
        return 'Obesity Class III'

df['BMI_Category'] = df['BMI'].apply(encode_bmi)

print("BMI_Category added with WHO 6-class encoding!")
print(df[['BMI', 'BMI_Category']].head(10))

