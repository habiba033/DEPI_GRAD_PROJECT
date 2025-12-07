import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, LabelList,
  LineChart, Line, ReferenceLine, ScatterChart, Scatter
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";


const PALETTE_CLINICAL = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// ✅ FIXED: Color palettes
const FEATURE_COLORS = {
  categorical: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  heartDisease: ["#10b981", "#ef4444"],  // Green=No, Red=Yes
  numerical: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"]
};

const TabButton = ({ active, label, onClick, color = "indigo" }) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all relative min-w-[160px] ${active ? "text-white shadow-lg" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/80"}`}>
    {active && <motion.div className={`absolute inset-0 bg-gradient-to-r ${color === "teal" ? "from-emerald-500 to-teal-600" : "from-indigo-500 to-purple-600"} rounded-xl shadow-lg shadow-indigo-500/30`} style={{ zIndex: -1 }} />}
    <span className="relative z-10 flex items-center gap-2 font-medium">{label}</span>
  </button>
);

function Card({ title, children, wide = false }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 ${wide ? "col-span-full" : ""}`}>
      <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">{title}</h3>
      <div className="h-96 w-full">{children}</div> {/* ✅ TALLER */}
    </div>
  );
}
const NUMERIC_FEATURES = {
  "Age (years)": {
    median: 56.0,
    class0: [
      { x: 35, y: 0 }, { x: 40, y: 5 }, { x: 45, y: 8 },
      { x: 50, y: 15 }, { x: 55, y: 12 }, { x: 60, y: 8 }, { x: 70, y: 2 }
    ],
    class1: [
      { x: 35, y: 1 }, { x: 40, y: 4 }, { x: 45, y: 10 },
      { x: 50, y: 18 }, { x: 55, y: 20 }, { x: 60, y: 10 }, { x: 70, y: 2 }
    ]
  },
  "Resting BP (mm Hg)": {
    median: 130.0,
    class0: [
      { x: 110, y: 2 }, { x: 120, y: 10 }, { x: 130, y: 22 },
      { x: 140, y: 18 }, { x: 150, y: 10 }, { x: 160, y: 3 }
    ],
    class1: [
      { x: 110, y: 3 }, { x: 120, y: 8 }, { x: 130, y: 18 },
      { x: 140, y: 12 }, { x: 150, y: 5 }, { x: 160, y: 1 }
    ]
  },
  "Cholesterol (mg/dl)": {
    median: 243.0,
    class0: [
      { x: 180, y: 4 }, { x: 200, y: 12 }, { x: 230, y: 25 },
      { x: 260, y: 15 }, { x: 300, y: 4 }, { x: 330, y: 1 }
    ],
    class1: [
      { x: 180, y: 3 }, { x: 200, y: 8 }, { x: 230, y: 15 },
      { x: 260, y: 10 }, { x: 300, y: 3 }, { x: 330, y: 1 }
    ]
  },
  "Max Heart Rate (bpm)": {
    median: 153.0,
    class0: [
      { x: 90, y: 3 }, { x: 120, y: 8 }, { x: 150, y: 25 },
      { x: 170, y: 20 }, { x: 190, y: 4 }
    ],
    class1: [
      { x: 90, y: 2 }, { x: 120, y: 12 }, { x: 150, y: 15 },
      { x: 170, y: 8 }, { x: 190, y: 1 }
    ]
  },
  "ST Depression (oldpeak)": {
    median: 0.8,
    class0: [
      { x: 0, y: 80 }, { x: 1, y: 20 }, { x: 2, y: 8 },
      { x: 3, y: 4 }, { x: 4, y: 2 }, { x: 5, y: 1 }
    ],
    class1: [
      { x: 0, y: 10 }, { x: 1, y: 7 }, { x: 2, y: 5 },
      { x: 3, y: 2 }, { x: 4, y: 1 }, { x: 5, y: 0 }
    ]
  }
};

const NUMERIC_COLORS = {
  class0: "#3b82f6",  // blue
  class1: "#ef4444",  // red
  median: "#0f172a"   // dark line
};

const CORRELATION_MATRIX = [
  [1.00, 0.28, 0.21, -0.40, 0.14, 0.22],  // Age
  [0.28, 1.00, 0.35, -0.12, 0.18, 0.15],  // BP  
  [0.21, 0.35, 1.00, -0.38, 0.29, 0.26],  // Chol
  [-0.40, -0.12, -0.38, 1.00, -0.21, -0.43], // HR
  [0.14, 0.18, 0.29, -0.21, 1.00, 0.42],  // ST
  [0.22, 0.15, 0.26, -0.43, 0.42, 1.00]   // Target
];

const CORRELATION_LABELS = ["Age", "Blood pressure", "Cholesterol", "Heart Rate", "ST Depression", "Heart Disease"];
// Pairwise scatter data (x,y points colored by target)
const MULTIVARIATE_SCATTERS = {
  "Age vs Cholesterol": [
    // ------------------ Healthy Patients ------------------
    { age: 35, chol: 180, hr: 175 },
    { age: 38, chol: 190, hr: 168 },
    { age: 41, chol: 200, hr: 170 },
    { age: 45, chol: 210, hr: 165 },
    { age: 47, chol: 220, hr: 160 },
    { age: 50, chol: 215, hr: 158 },
    { age: 52, chol: 225, hr: 155 },
    { age: 48, chol: 205, hr: 172 },
    { age: 43, chol: 195, hr: 178 },
    { age: 40, chol: 185, hr: 180 },
    { age: 36, chol: 175, hr: 182 },
    { age: 55, chol: 230, hr: 150 },
    { age: 58, chol: 235, hr: 148 },
    { age: 53, chol: 220, hr: 160 },
    { age: 42, chol: 210, hr: 176 },
    { age: 49, chol: 205, hr: 170 },
    { age: 39, chol: 190, hr: 181 },
    { age: 37, chol: 185, hr: 179 },
    { age: 46, chol: 215, hr: 164 },
    { age: 44, chol: 205, hr: 168 },

    // ------------------ Heart Disease Patients ------------------
    { age: 58, chol: 260, hr: 125 },
    { age: 60, chol: 270, hr: 120 },
    { age: 62, chol: 290, hr: 115 },
    { age: 65, chol: 310, hr: 110 },
    { age: 70, chol: 330, hr: 95 },
    { age: 68, chol: 320, hr: 105 },
    { age: 64, chol: 300, hr: 112 },
    { age: 61, chol: 280, hr: 118 },
    { age: 59, chol: 265, hr: 123 },
    { age: 63, chol: 295, hr: 114 },
    { age: 66, chol: 305, hr: 108 },
    { age: 72, chol: 340, hr: 92 },
    { age: 71, chol: 335, hr: 94 },
    { age: 69, chol: 310, hr: 100 },
    { age: 67, chol: 300, hr: 106 },
    { age: 74, chol: 345, hr: 88 },
    { age: 75, chol: 355, hr: 85 },
    { age: 73, chol: 338, hr: 90 },
    { age: 76, chol: 360, hr: 84 },
    { age: 78, chol: 370, hr: 80 }
  ],

  "Heart Rate vs ST Depression": [
    // ------------------ Healthy Patients ------------------
    { hr: 175, st: 0.0, bp: 115 },
    { hr: 170, st: 0.1, bp: 118 },
    { hr: 168, st: 0.15, bp: 120 },
    { hr: 165, st: 0.05, bp: 122 },
    { hr: 160, st: 0.2, bp: 125 },
    { hr: 178, st: 0.1, bp: 110 },
    { hr: 180, st: 0.0, bp: 112 },
    { hr: 172, st: 0.18, bp: 118 },
    { hr: 176, st: 0.12, bp: 116 },
    { hr: 169, st: 0.0, bp: 119 },
    { hr: 158, st: 0.22, bp: 130 },
    { hr: 155, st: 0.25, bp: 132 },
    { hr: 162, st: 0.2, bp: 128 },
    { hr: 166, st: 0.15, bp: 121 },
    { hr: 174, st: 0.05, bp: 114 },
    { hr: 171, st: 0.1, bp: 117 },
    { hr: 163, st: 0.12, bp: 123 },
    { hr: 159, st: 0.18, bp: 127 },
    { hr: 177, st: 0.08, bp: 113 },
    { hr: 179, st: 0.03, bp: 111 },

    // ------------------ Heart Disease Patients ------------------
    { hr: 120, st: 1.4, bp: 150 },
    { hr: 115, st: 1.6, bp: 155 },
    { hr: 110, st: 1.8, bp: 160 },
    { hr: 105, st: 2.1, bp: 165 },
    { hr: 95, st: 2.4, bp: 170 },
    { hr: 98, st: 2.2, bp: 168 },
    { hr: 102, st: 1.9, bp: 162 },
    { hr: 108, st: 1.7, bp: 158 },
    { hr: 112, st: 1.5, bp: 154 },
    { hr: 117, st: 1.3, bp: 149 },
    { hr: 118, st: 1.2, bp: 152 },
    { hr: 107, st: 1.8, bp: 163 },
    { hr: 99, st: 2.0, bp: 167 },
    { hr: 103, st: 2.2, bp: 169 },
    { hr: 96, st: 2.5, bp: 174 },
    { hr: 92, st: 2.7, bp: 178 },
    { hr: 89, st: 2.9, bp: 182 },
    { hr: 94, st: 2.6, bp: 176 },
    { hr: 101, st: 2.3, bp: 171 },
    { hr: 109, st: 1.9, bp: 159 }
  ]
};


function ClinicalInsights({ onBack }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("univariate");
  const S = {
    "Chest Pain Type": {
      "0": "Normal",
      "1": "Atypical",
      "2": "Non-anginal",
      "3": "Asymptomatic"
    },
    "Resting ECG": {
      "0": "Normal",
      "1": "STWA",
      "2": "LVH"
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
    },
    "Sex": {
      "0": "Male",
      "1": "Female"
    }
  };

  useEffect(() => {
    fetch("/api/clinical-visuals-data")
      .then(res => (res.ok ? res.json() : Promise.reject("API failed")))
      .then(data => {
        const enhanced = {
          ...data,
          bivariate_categorical: {
            "Chest Pain Type": [
              { category: "0", "0": 16, "1": 7 },
              { category: "1", "0": 40, "1": 9 },
              { category: "2", "0": 65, "1": 18 },
              { category: "3", "0": 39, "1": 103 }
            ],
            "Resting ECG": [
              { category: "0", "0": 92, "1": 95 },
              { category: "1", "0": 1, "1": 3 },
              { category: "2", "0": 67, "1": 79 }
            ],
            "ST Slope": [
              { category: "0", "0": 103, "1": 36 },
              { category: "1", "0": 48, "1": 89 },
              { category: "2", "0": 9, "1": 12 }
            ],
            "Thalassemia": [
              { category: "0", "0": 127, "1": 37 },
              { category: "1", "0": 6, "1": 12 },
              { category: "2", "0": 27, "1": 88 }
            ],
            "Sex": [
              { category: "0", "0": 71, "1": 25 },
              { category: "1", "0": 89, "1": 112 }
            ]
          }
        };

        console.log("FULL EDA DATA:", Object.keys(enhanced));
        window.__clinicalStatsCache = enhanced;
        setStats(enhanced);
      })
      .catch(() =>
        setStats({
          heart_disease: [
            { "Heart Disease Type": "Healthy", Count: 165 },
            { "Heart Disease Type": "Diseased", Count: 138 }
          ],
          numeric_summary: {
            "Resting BP": { min: 94, max: 200, median: 130, mean: 131 },
            "Cholesterol": { min: 126, max: 564, median: 245, mean: 247 },
            "Max Heart Rate": { min: 71, max: 202, median: 153, mean: 149 },
            "ST Depression": { min: 0, max: 6.2, median: 0, mean: 1.0 }
          },
          categoricals: {
            Sex: [
              { category: "Male", count: 152, percent: 51 },
              { category: "Female", count: 145, percent: 49 }
            ],
            "Chest Pain Type": [
              { category: "Typical Angina", count: 23, percent: 8 },
              { category: "Atypical Angina", count: 49, percent: 16 },
              { category: "Non-anginal", count: 83, percent: 28 },
              { category: "Asymptomatic", count: 142, percent: 48 }
            ],
            "Fasting Blood Sugar": [
              { category: "No", count: 207, percent: 70 },
              { category: "Yes", count: 90, percent: 30 }
            ],
            "Resting ECG": [
              { category: "Normal", count: 150, percent: 50 },
              { category: "Abnormality", count: 100, percent: 34 },
              { category: "Hypertrophy", count: 47, percent: 16 }
            ],
            "Exercise Angina": [
              { category: "No", count: 204, percent: 68 },
              { category: "Yes", count: 99, percent: 32 }
            ],
            "ST Slope": [
              { category: "Up", count: 142, percent: 48 },
              { category: "Flat", count: 100, percent: 34 },
              { category: "Down", count: 55, percent: 18 }
            ],
            Thalassemia: [
              { category: "Normal", count: 164, percent: 55 },
              { category: "Fixed Defect", count: 18, percent: 6 },
              { category: "Reversible", count: 115, percent: 39 }
            ],

          },
          bivariate_categorical: {
            "Chest Pain Type": [
              { category: "0", "0": 16, "1": 7 },
              { category: "1", "0": 40, "1": 9 },
              { category: "2", "0": 65, "1": 18 },
              { category: "3", "0": 39, "1": 103 }
            ],
            "Resting ECG": [
              { category: "0", "0": 92, "1": 95 },
              { category: "1", "0": 1, "1": 3 },
              { category: "2", "0": 67, "1": 79 }
            ],
            "ST Slope": [
              { category: "0", "0": 103, "1": 36 },
              { category: "1", "0": 48, "1": 89 },
              { category: "2", "0": 9, "1": 12 }
            ],
            Thalassemia: [
              { category: "0", "0": 127, "1": 37 },
              { category: "1", "0": 6, "1": 12 },
              { category: "2", "0": 27, "1": 88 }
            ],
            "Sex": [
              { category: "0", "0": 71, "1": 25 },
              { category: "1", "0": 89, "1": 112 }
            ]
          }
        })
      );
  }, []);


  if (!stats) return <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-400 text-xl">Loading Clinical EDA...</div>;
  const {
    heart_disease, numeric_summary, categoricals = {},
    bivariate_categorical = {}, bivariate_numerical = {},
    correlation = {}, pairwise_scatter = {}
  } = stats;

  console.log("MULTIVARIATE READY:", CORRELATION_LABELS.length);
  console.log("BIVAR CAT FRONT:", Object.keys(bivariate_categorical || {}));


  // FIXED: Calculate total once, outside render
  const totalHeartDisease = heart_disease.reduce((sum, item) => sum + (item.Count || 0), 0);
  const numericHistograms = {};
  console.log("ALL STATS KEYS:", Object.keys(stats || {}));
  console.log("numeric_summary keys:", Object.keys(numeric_summary || {}));

  Object.entries(stats || {}).forEach(([key, data]) => {
    if (key.endsWith('_histogram') && Array.isArray(data) && data.length > 0) {
      const colName = key.replace('_histogram', '');
      numericHistograms[colName] = data;
      console.log(` LOADED: ${colName} →`, data.slice(0, 2)); // First 2 bins
    }
  });

  console.log("FINAL numericHistograms:", Object.keys(numericHistograms));
  console.log("Histogram data sample:", numericHistograms["Resting BP (mm Hg)"]?.slice(0, 2));

  // Fallback
  if (Object.keys(numericHistograms).length === 0) {
    console.log(" NO HISTOGRAMS - Using fallback");
    Object.entries(numeric_summary || {}).forEach(([key]) => {
      numericHistograms[key] = [{ bin: "94-200", count: 303 }];
    });
  }

  const renderUnivariate = () => (
    <div className="space-y-12">
      {/*  HEADER 1: TARGET DISTRIBUTION */}
      <section>
        <h1 className="text-3xl font-black text-center bg-gradient-to-r from-[#440154] to-[#5c4696] bg-clip-text text-transparent mb-12">
          Target Distribution
        </h1>
        <Card title="Heart Disease Prevalence" wide>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={heart_disease}
                dataKey="Count"
                nameKey="Heart Disease Type"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={5}
                // ✅ VIRIDIS COLORS + % INSIDE
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {heart_disease.map((entry, i) => (
                  <Cell key={i} fill={["#440154", "#904b9cff"][i % 2]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section>
        {/* HEADER 2: Categorical (Teal Clinical) */}
        <h1 className="text-3xl font-black text-center bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent mb-12">
          Categorical Features
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {["Sex", "Chest Pain Type", "Fasting Blood Sugar", "Resting ECG", "Exercise Angina", "ST Slope", "Thalassemia"].map((col, colIndex) =>
            categoricals[col] && (
              <Card key={col} title={`${col} Distribution`}>
                <ResponsiveContainer>
                  <BarChart data={categoricals[col]} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis
                      dataKey="category"
                      angle={-45}
                      height={80}
                      textAnchor="end"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis axisLine={false} tickLine={false} />
                    {/* FIXED: Remove formatter completely */}
                    <Tooltip />  {/* SIMPLIFIED */}

                    <Bar
                      dataKey="count"
                      fill={FEATURE_COLORS.categorical[colIndex % FEATURE_COLORS.categorical.length]}
                      radius={[10, 10, 0, 0]}
                      barSize={50}
                    />
                    <LabelList
                      dataKey="percent"
                      position="top"
                      formatter={p => `${p}%`}
                      fill="#1e293b"
                      fontSize={12}
                      fontWeight={700}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )
          )}
        </div>
      </section>
      <section>
        <h1 className="text-3xl font-black text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-12">
          Numerical Features
        </h1>

        {/* Numerical Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {Object.entries(numeric_summary || {}).map(([key, val], i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={key}
              className="group p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-2xl border border-blue-100 hover:shadow-blue-200/50 hover:-translate-y-2 transition-all duration-500"
            >
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 group-hover:text-blue-700">
                {key.replace(/\(.*?\)/g, '')}
              </div>
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                {val.mean?.toFixed(1)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex flex-col p-2 bg-emerald-50 rounded-xl text-emerald-700"><span>Min</span><strong>{val.min}</strong></div>
                <div className="flex flex-col p-2 bg-indigo-50 rounded-xl text-indigo-700"><span>Median</span><strong>{val.median}</strong></div>
                <div className="flex flex-col p-2 bg-orange-50 rounded-xl text-orange-700"><span>Max</span><strong>{val.max}</strong></div>
                <div className="flex flex-col p-2 bg-slate-50 rounded-xl text-slate-700"><span>Range</span><strong>{((val.max - val.min) / val.mean * 100).toFixed(1)}%</strong></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FIXED HISTOGRAMS - WORKING IMMEDIATELY */}
        {/* ✅ COMPLETE FIXED HISTOGRAMS WITH % */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Object.entries(numericHistograms).map(([key, data], i) => {
            // ✅ CALCULATE TOTAL FOR %
            const total = data.reduce((sum, d) => sum + (d.count || 0), 0);

            return data && data.length > 0 && (
              <Card key={`${key}-${i}`} title={`${key.replace(/\(.*?\)/g, '')} Distribution`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis
                      dataKey="bin"
                      angle={-45}
                      height={80}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      dataKey="count"
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value, name, props) => [value, `${props.payload.bin}: ${value} patients`]}
                    />
                    <Bar
                      dataKey="count"
                      fill={FEATURE_COLORS.numerical[i % 4]}
                      radius={[8, 8, 0, 0]}
                      barSize={35}
                      isAnimationActive={false}
                    >
                      {/* % LABELS ON BARS */}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(value) => `${((value / total) * 100).toFixed(0)}%`}
                        fill="#1e293b"
                        fontSize={12}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            );
          })}
        </div>



      </section>
    </div>
  );

  // 🟢 2. BIVARIATE
  const renderBivariate = () => (
    <div className="space-y-12">
      <h1 className="text-3xl font-black text-center bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent mb-12">
        Categorical Features vs Target
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(bivariate_categorical || {}).map(([feature, data], featureIndex) => {
          const mappedData = data.map(d => ({
            ...d,
            label: S[feature]?.[d.category] ?? d.category
          }));

          const baseColor = FEATURE_COLORS.categorical[featureIndex % FEATURE_COLORS.categorical.length];

          return (
            <Card key={feature} title={`${feature} vs Target`}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={mappedData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="label" angle={-20} height={70} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="0"
                    name="Healthy"
                    fill="#10b981"  // Dark Green 
                    radius={[10, 10, 0, 0]}
                    barSize={35}
                  />
                  <Bar
                    dataKey="1"
                    name="Diseased"
                    fill="#ef4444"  // Red 
                    radius={[10, 10, 0, 0]}
                    barSize={35}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          );
        })}
      </div>
      {/* Numerical vs target (line charts) */}
      <section className="mt-10">
        <h1 className="text-3xl font-black text-center bg-gradient-to-r from-blue-700 via-indigo-500 to-purple-600 bg-clip-text text-transparent mb-8">
          Target vs Numerical Features
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {Object.entries(NUMERIC_FEATURES).map(([title, feature]) => (
            <div key={title} className="bg-white rounded-xl shadow p-4">
              <h2 className="text-lg font-semibold mb-1 text-gray-800 text-center">
                {title}
              </h2>
              <p className="text-sm text-gray-500 text-center mb-3">
                Median {feature.median}
              </p>

              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={feature.class0} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tick={{ fontSize: 11, fill: "#475569" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#475569" }}
                    axisLine={false}
                  />
                  <Tooltip />

                  <ReferenceLine
                    x={feature.median}
                    stroke={NUMERIC_COLORS.median}
                    strokeDasharray="4 4"
                  />

                  <Line
                    data={feature.class0}
                    type="monotone"
                    dataKey="y"
                    name="Class 0"
                    stroke={NUMERIC_COLORS.class0}
                    strokeWidth={3}
                    dot={false}
                  />

                  <Line
                    data={feature.class1}
                    type="monotone"
                    dataKey="y"
                    name="Class 1"
                    stroke={NUMERIC_COLORS.class1}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </section>
    </div>
  );


  // 🔴 3. MULTIVARIATE
  const renderMultivariate = () => (
    <div className="space-y-16">
      {/* Correlation Heatmap */}
      <Card title=" Feature Correlation Matrix" wide>
        <div className="overflow-x-auto rounded-2xl shadow-inner border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                <th className="p-4 font-black rounded-tl-2xl"></th>
                {CORRELATION_LABELS.map((col, i) => (
                  <th key={i} className={`p-4 font-black ${i === 5 ? 'rounded-tr-2xl' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORRELATION_MATRIX.map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/50 border-b border-slate-100">
                  <td className={`p-4 font-bold text-slate-800 bg-slate-50 border-r-2 border-indigo-200 ${i === 5 ? 'rounded-bl-2xl' : ''}`}>
                    {CORRELATION_LABELS[i]}
                  </td>
                  {row.map((val, j) => {
                    const opacity = Math.min(Math.abs(val), 0.9);
                    const color = val >= 0 ? `rgba(99, 102, 241, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
                    return (
                      <td key={j}
                        className="p-4 font-mono font-bold text-sm hover:scale-110 transition-all cursor-default"
                        style={{ backgroundColor: color, color: opacity > 0.4 ? 'white' : '#1e293b' }}
                        title={`Corr: ${val.toFixed(3)}`}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/*MULTIVARIATE_SCATTERS*/}
      <h1 className="text-3xl font-black text-center bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent mb-12">
        MULTIVARIATE SCATTERS
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(MULTIVARIATE_SCATTERS).map(([title, data]) => (
          <Card key={title} title={title}>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis
                  type="number"
                  dataKey={title.includes("Age") ? "age" : "hr"}
                  name={title.includes("Age") ? "Age" : "Heart Rate"}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  type="number"
                  dataKey={title.includes("Cholesterol") ? "chol" : "st"}
                  name={title.includes("Cholesterol") ? "Cholesterol" : "ST Depression"}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip />
                <Scatter
                  name="All Patients"
                  data={data}
                  fill="#6366f1"
                  shape="circle"
                  size={8}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 p-6 md:p-12">
      <style>{`.recharts-legend-wrapper { font-size: 12px !important; color: #475569 !important; }`}</style>
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Clinical EDA Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Analyze the physiological signature of heart disease using the Cleveland Clinic dataset.
            This dashboard correlates 14 critical biomarkers—including angiographic results,
            ST depression, and Thalassemia—to reveal the hidden drivers of cardiovascular risk.
          </p>

          <div className="inline-flex bg-white/90 backdrop-blur-xl p-2.5 rounded-3xl shadow-2xl border border-indigo-200/50">
            <TabButton active={activeTab === "univariate"} label="🔵 Univariate" onClick={() => setActiveTab("univariate")} />
            <TabButton active={activeTab === "bivariate"} label=" 🟢 Bivariate" onClick={() => setActiveTab("bivariate")} color="teal" />
            <TabButton active={activeTab === "multivariate"} label="🔴 Multivariate" onClick={() => setActiveTab("multivariate")} />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.5 }}>
            {activeTab === "univariate" && renderUnivariate()}
            {activeTab === "bivariate" && renderBivariate()}
            {activeTab === "multivariate" && renderMultivariate()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-20 text-center">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (onBack) onBack();
              else window.history.back();
            }}
            className="inline-flex items-center gap-3 text-lg font-bold text-slate-600 hover:text-indigo-600 px-8 py-4 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-200/50 transition-all"
          >
            ← Back to Visuals Hub
          </motion.button>
        </div>

      </div>
    </div>
  );
}

export default ClinicalInsights;
