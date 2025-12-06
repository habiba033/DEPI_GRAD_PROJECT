import React, { useEffect, useState } from "react";
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#4A90E2", "#50E3C2", "#F5A623", "#D0021B", "#9013FE", "#7ED321"];
const fadeIn = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

function StyleBlock() {
    const css = `
    .recharts-legend-wrapper {
      font-size: 12px !important;
      color: #475569 !important;
    }
  `;
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

const styles = {
    pageWrap: {
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f8fafc,#ffffff)",
        padding: "28px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        color: "#0f172a",
    },
    container: { maxWidth: 1300, margin: "0 auto" },
    header: { textAlign: "center", marginBottom: 20 },
    title: {
        fontSize: "clamp(28px, 4.5vw, 40px)",
        margin: 0,
        fontWeight: 900,
        letterSpacing: "-0.6px",
    },
    titleGradient: {
        background: "linear-gradient(90deg,#6D28D9,#EC4899)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    subtitle: { marginTop: 8, fontSize: 15, color: "#475569" },
    ghostBtn: {
        padding: "0.5rem 1rem",
        borderRadius: "999px",
        border: "1px solid #cbd5f5",
        background: "white",
        color: "#4b5563",
        fontSize: "0.875rem",
        fontWeight: 600,
        cursor: "pointer",
        marginRight: 12,
    },
};

const cellColor = (v) => {
    const t = Math.min(Math.abs(v), 1);
    if (v > 0) return `rgba(56, 189, 248, ${t})`;
    if (v < 0) return `rgba(244, 63, 94, ${t})`;
    return "rgba(226, 232, 240, 0.6)";
};

function downloadJSON(data) {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clinical_insights.json";
    a.click();
    URL.revokeObjectURL(url);
}

export default function ClinicalInsights() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetch("/api/clinical-visuals-data")
            .then(res => {
                if (!res.ok) throw new Error("Failed to load clinical insights");
                return res.json();
            })
            .then(data => {
                window.__clinicalStatsCache = data;
                setStats(data);
                // ✅ DEBUG LOGS
                console.log("Heart disease data:", data.heart_disease);
                console.log("First categorical:", Object.keys(data.categoricals)[0], data.categoricals[Object.keys(data.categoricals)[0]]);
                console.log("Numeric summary keys:", Object.keys(data.numeric_summary));
            })
            .catch(err => console.error("Error loading clinical insights:", err));
    }, []);

    if (!stats) return <p className="text-center mt-10">Loading clinical insights…</p>;

    const { heart_disease, numeric_summary, categoricals, correlation, numeric_plot_url } = stats;

    return (
        <div style={styles.pageWrap}>
            <StyleBlock />
            <div style={styles.container}>
                <header style={styles.header}>
                    <h1 style={styles.title}>
                        <span style={styles.titleGradient}>Clinical Insights</span>
                    </h1>
                    <p style={styles.subtitle}>Interactive, animated medical‑grade visuals</p>
                    <div style={{ marginTop: 12 }}>
                        <button style={styles.ghostBtn} onClick={() => downloadJSON(stats)}>
                            Export JSON
                        </button>
                        <a href="/visuals" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-600 mb-4">
                            ← Back to Visuals Hub
                        </a>
                    </div>
                </header>

                <main className="grid md:grid-cols-1 gap-6 mt-4">
                    {/* ✅ FIXED HEART DISEASE PIE */}
                    {heart_disease?.length > 0 && (
                        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white shadow rounded-xl p-5 mb-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">Heart Disease Distribution</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={heart_disease}
                                        dataKey="Count"           // ✅ FIXED: Capital C
                                        nameKey="Heart Disease Type"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={110}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                    >
                                        {heart_disease.map((entry, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* NUMERIC SUMMARY CARDS */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                        {Object.entries(numeric_summary).map(([label, val], i) => (
                            <motion.div
                                key={label}
                                initial="hidden"
                                animate="visible"
                                variants={fadeIn}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-5 rounded-xl shadow"
                            >
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">{label}</h3>
                                <p className="text-gray-600"><b>Min:</b> {val.min}</p>
                                <p className="text-gray-600"><b>Median:</b> {val.median}</p>
                                <p className="text-gray-600"><b>Mean:</b> {val.mean != null ? val.mean.toFixed(1) : "N/A"}</p>
                                <p className="text-gray-600"><b>Max:</b> {val.max}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* ✅ FIXED NUMERIC PLOT IMAGE */}
                    {numeric_plot_url && (
                        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white shadow rounded-xl p-5 mb-6">
                            <img src={numeric_plot_url} alt="Target vs Numeric Distributions" className="rounded-xl shadow max-w-full w-full" />
                        </motion.div>
                    )}

                    {/* ✅ FIXED CATEGORICAL BARS */}
                    {Object.keys(categoricals).length > 0 ? (
                        Object.entries(categoricals).map(([col, values], i) => (
                            <motion.div
                                key={col}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeIn}
                                transition={{ delay: i * 0.15 }}
                                className="bg-white shadow rounded-xl p-6 mb-6"
                            >
                                <h2 className="text-xl font-semibold mb-4 text-gray-700">{col}</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={values}>
                                        <XAxis dataKey="category" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"  // ✅ FIXED: lowercase matches backend
                                            fill={COLORS[i % COLORS.length]}
                                            radius={[8, 8, 0, 0]}
                                            label={{         // ✅ FIXED: Simple % label
                                                position: "top",
                                                formatter: (value) => `${values.find(v => v.count === value)?.percent || 0}%`
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-12 col-span-full">No categorical data available</p>
                    )}

                    {/* CORRELATION HEATMAP */}
                    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-white p-6 shadow rounded-xl">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Correlation Matrix</h2>
                        {correlation.columns.length === 0 ? (
                            <p>No numeric features available.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300 text-center">
                                    <thead>
                                        <tr>
                                            <th className="border p-2"></th>
                                            {correlation.columns.map((c) => (
                                                <th className="border p-2 bg-gray-100" key={c}>{c}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {correlation.matrix.map((row, i) => (
                                            <tr key={i}>
                                                <td className="border p-2 font-semibold bg-gray-100">{correlation.columns[i]}</td>
                                                {row.map((v, j) => (
                                                    <td
                                                        key={j}
                                                        className="border p-2"
                                                        style={{
                                                            backgroundColor: cellColor(v),
                                                            color: Math.abs(v) > 0.5 ? "white" : "black",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {v}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
