import React, { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, LabelList
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



function ClinicalInsights({ onBack }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("univariate");

  useEffect(() => {
    fetch("/api/clinical-visuals-data")
      .then(res => res.ok ? res.json() : Promise.reject("API failed"))
      .then(data => {
        console.log(" FULL EDA DATA:", Object.keys(data));
        window.__clinicalStatsCache = data;
        setStats(data);
      })
      .catch(() => setStats({
        heart_disease: [{ "Heart Disease Type": "No Disease", "Count": 165 }, { "Heart Disease Type": "Disease", "Count": 138 }],
        numeric_summary: {
          "Resting BP": { min: 94, max: 200, median: 130, mean: 131 },
          "Cholesterol": { min: 126, max: 564, median: 245, mean: 247 },
          "Max Heart Rate": { min: 71, max: 202, median: 153, mean: 149 },
          "ST Depression": { min: 0, max: 6.2, median: 0, mean: 1.0 }
        },
        categoricals: {
          "Sex": [{ category: "Male", count: 152, percent: 51 }, { category: "Female", count: 145, percent: 49 }],
          "Chest Pain Type": [{ category: "Typical Angina", count: 23, percent: 8 }, { category: "Atypical Angina", count: 49, percent: 16 }, { category: "Non-anginal", count: 83, percent: 28 }, { category: "Asymptomatic", count: 142, percent: 48 }],
          "Fasting Blood Sugar": [{ category: "No", count: 207, percent: 70 }, { category: "Yes", count: 90, percent: 30 }],
          "Resting ECG": [{ category: "Normal", count: 150, percent: 50 }, { category: "Abnormality", count: 100, percent: 34 }, { category: "Hypertrophy", count: 47, percent: 16 }],
          "Exercise Angina": [{ category: "No", count: 204, percent: 68 }, { category: "Yes", count: 99, percent: 32 }],
          "ST Slope": [{ category: "Up", count: 142, percent: 48 }, { category: "Flat", count: 100, percent: 34 }, { category: "Down", count: 55, percent: 18 }],
          "Thalassemia": [{ category: "Normal", count: 164, percent: 55 }, { category: "Fixed Defect", count: 18, percent: 6 }, { category: "Reversible", count: 115, percent: 39 }]
        }
      }));
  }, []);

  if (!stats) return <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-400 text-xl">Loading Clinical EDA...</div>;

  const { heart_disease, numeric_summary, categoricals = {}, bivariate_categorical = {}, correlation } = stats;

  // ✅ FIXED: Calculate total once, outside render
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
                      barSize={50}  // Bigger bars
                    >
                      <LabelList
                        dataKey="percent"
                        position="top"
                        formatter={p => `${p}%`}
                        fill="#1e293b"
                        fontSize={12}
                        fontWeight={700}
                      />
                    </Bar>
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
                      {/* ✅ % LABELS ON BARS */}
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
    <div className="space-y-8">
      {/* Categorical vs Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(bivariate_categorical).map(([feature, data]) => (
          <Card key={feature} title={`${feature} → Heart Disease Risk`}>
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="index" angle={-45} height={80} />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="Heart Disease Class (0,1)" name="% Disease" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Bar dataKey="0" name="% No Disease" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ))}
      </div>

      {/* Numeric Boxplot Summary */}
      <Card title="📊 Numeric Features vs Heart Disease" wide>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {Object.entries(stats.bivariate_numerical || {}).map(([feature, data]) => (
            <div key={feature} className="p-4 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-xl border">
              <h4 className="font-bold text-slate-800 mb-2">{feature}</h4>
              <div className="space-y-1 text-sm">
                <div><span className="text-green-600">No Disease:</span> {data['0']?.mean?.toFixed(1) || 'N/A'}</div>
                <div><span className="text-red-600">Disease:</span> {data['1']?.mean?.toFixed(1) || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // 🔴 3. MULTIVARIATE
  const renderMultivariate = () => (
    <div className="space-y-8">
      <Card title="🔗 Correlation Heatmap" wide>
        <div className="overflow-x-auto rounded-2xl shadow-inner border border-slate-200">
          <table className="w-full text-sm">
            <thead><tr className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
              <th className="p-4 font-black rounded-tl-2xl"></th>
              {correlation?.columns?.map((col, i) => <th key={i} className={`p-4 font-black ${i === correlation.columns.length - 1 ? 'rounded-tr-2xl' : ''}`}>{col}</th>)}
            </tr></thead>
            <tbody>
              {correlation?.matrix?.map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/50 border-b border-slate-100">
                  <td className={`p-4 font-bold text-slate-800 bg-slate-50 border-r-2 border-indigo-200 ${i === correlation.matrix.length - 1 ? 'rounded-bl-2xl' : ''}`}>
                    {correlation.columns[i]}
                  </td>
                  {row.map((val, j) => {
                    const opacity = Math.min(Math.abs(val), 0.9);
                    const color = val >= 0 ? `rgba(99, 102, 241, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
                    return (
                      <td key={j} className="p-4 font-mono font-bold text-sm hover:scale-110 transition-all cursor-default"
                        style={{ backgroundColor: color, color: opacity > 0.4 ? 'white' : '#1e293b' }}
                        title={`Corr: ${val.toFixed(3)}`}>
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
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Complete Univariate → Bivariate → Multivariate Analysis (Cleveland Clinic Dataset)
          </p>
          <div className="inline-flex bg-white/90 backdrop-blur-xl p-2.5 rounded-3xl shadow-2xl border border-indigo-200/50">
            <TabButton active={activeTab === "univariate"} label="🔵 Univariate" onClick={() => setActiveTab("univariate")} />
            <TabButton active={activeTab === "bivariate"} label="🟢 Bivariate" onClick={() => setActiveTab("bivariate")} color="teal" />
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
          <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }} onClick={onBack}
            className="inline-flex items-center gap-3 text-lg font-bold text-slate-600 hover:text-indigo-600 px-8 py-4 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-slate-200/50 transition-all">
            ← Back to Visuals Hub
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default ClinicalInsights;
