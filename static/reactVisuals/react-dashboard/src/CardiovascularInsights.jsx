import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";



function CardiovascularInsights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/visuals-data")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch visuals data");
        return r.json();
      })
      .then((d) => {
        console.log("VISUALS DATA:", d);
        setData(d);
      })
      .catch((err) => {
        console.error(err);
        setData({ __error: String(err) });
      });
  }, []);

  // Loading / error
  if (!data) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner} aria-hidden />
          <div style={{ marginTop: 18, fontSize: 18, color: "#0f172a" }}>
            Loading visuals...
          </div>
        </div>
      </div>
    );
  }

  if (data.__error) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.errorCard}>
          <h3 style={{ margin: 0 }}>Error</h3>
          <p style={{ marginTop: 8 }}>{data.__error}</p>
          <p style={{ marginTop: 12, fontSize: 13, color: "#475569" }}>
            Make sure Flask is running and <code>/api/visuals-data</code> works.
          </p>
        </div>
      </div>
    );
  }

  // Palette (Medical Clean Pro)
  const palette = {
    navy: "#0f172a",
    medicalBlue: "#4B88E6", // primary
    medicalLightBlue: "#6EC3E0", // accent
    medicalGreen: "#84C7A9",
    coral: "#FB7185",
    purpleAccent: "#7c3aed",
    softGray: "#94a3b8",
  };

  // Tooltip style (used everywhere)
  const tooltipStyle = {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "8px 12px",
    boxShadow: "0 6px 18px rgba(2,6,23,0.12)",
  };
  const tooltipWrapper = { zIndex: 9999 };

  // ---------------- Data mapping ----------------
  const heartRaw = data.heart_disease || {};
  const heartData = [
    { name: "No", value: Number(heartRaw["No"] || heartRaw["0"] || 0) },
    { name: "Yes", value: Number(heartRaw["Yes"] || heartRaw["1"] || 0) },
  ];
  const heartColors = [palette.medicalLightBlue, palette.medicalGreen];

  const healthData = Object.entries(data.general_health || {}).map(
    ([name, value]) => ({ name, value: Number(value) })
  );
  const healthColors = [
    palette.medicalLightBlue,
    palette.medicalBlue,
    palette.medicalGreen,
    "#a7f3d0",
    "#fef08a",
  ];

  const diabetesRaw = data.diabetes || {};
  const diabetesData = [
    { name: "No", value: Number(diabetesRaw["No"] || 0) },
    {
      name: "Borderline",
      value: Number(
        diabetesRaw["No, pre-diabetes or borderline diabetes"] || 0
      ),
    },
    { name: "Yes", value: Number(diabetesRaw["Yes"] || 0) },
    {
      name: "Pregnancy Only",
      value: Number(
        diabetesRaw["Yes, but female told only during pregnancy"] || 0
      ),
    },
  ];
  const diabetesColors = [
    palette.medicalBlue,
    palette.medicalLightBlue,
    palette.medicalGreen,
    "#E6B44B",
  ];

  const sexData = Object.entries(data.sex || {}).map(([name, value]) => ({
    name,
    count: Number(value),
  }));
  // sex color mapping (male/female)
  const sexColorFor = (n) =>
    String(n).toLowerCase().startsWith("m") ? "#2563eb" : "#ec4899";

  const ageRaw = data.age_disease || [];
  const ageMap = {};
  ageRaw.forEach((row) => {
    const age = row.Age_Category ?? row.age ?? "Unknown";
    const hd = String(row.Heart_Disease || row.heart_disease || "").toLowerCase();
    const yes = hd === "yes" || hd === "1" || hd === "true";
    if (!ageMap[age]) ageMap[age] = { age, No: 0, Yes: 0 };
    const count = Number(row.Count ?? row.count ?? 0);
    ageMap[age][yes ? "Yes" : "No"] += count;
  });
  const ageData = Object.values(ageMap);

  const bmiData = (data.bmi_exercise || []).map((r) => ({
    exercise: r.Exercise ?? r.exercise ?? "Unknown",
    bmi: Number(r.mean ?? r.bmi ?? 0),
  }));

  // ---------------- Helpers ----------------
  function downloadJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visuals-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------------- Render ----------------
  return (
    <div style={styles.pageWrap}>
      <StyleBlock />
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>
            <span style={styles.titleGradient}>Cardiovascular Insights</span>
          </h1>
          <p style={styles.subtitle}>
            Interactive, animated medical-grade visuals
          </p>
          <div style={{ marginTop: 12 }}>
            <button style={styles.ghostBtn} onClick={downloadJSON}>
              Export JSON
            </button>
            <a
              href="/visuals"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600
             hover:text-rose-600 mb-4"
            >
              ← Back to Visuals Hub
            </a>

          </div>
        </header>

        <main style={styles.grid}>
          {/* Heart Disease Pie (animated, labels smaller + no line) */}
          <Card delay={50} title="Heart Disease Distribution">
            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={heartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={104}
                    paddingAngle={4}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(1)}%`
                    }
                    isAnimationActive={true}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  >
                    {heartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={heartColors[i % heartColors.length]}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={tooltipWrapper} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* General Health */}
          <Card delay={120} title="General Health">
            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={98}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    isAnimationActive={true}
                    animationDuration={1200}
                  >
                    {healthData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={healthColors[i % healthColors.length]}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={tooltipWrapper} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Diabetes */}
          <Card delay={190} title="Diabetes Status">
            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diabetesData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(1)}%`
                    }
                    isAnimationActive={true}
                    animationDuration={1300}
                  >
                    {diabetesData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={diabetesColors[i % diabetesColors.length]}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={tooltipWrapper} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Sex Distribution (animated bars, each cell colored male/female) */}
          <Card delay={260} title="Sex Distribution">
            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sexData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eef6" />
                  <XAxis dataKey="name" stroke={palette.softGray} />
                  <YAxis stroke={palette.softGray} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={tooltipWrapper} />
                  <Bar
                    dataKey="count"
                    animationDuration={900}
                    radius={[8, 8, 0, 0]}
                    fill={palette.medicalBlue}
                  >
                    {sexData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={sexColorFor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Heart Disease by Age (stacked, two colors, animated) */}
          <Card delay={330} title="Heart Disease by Age">
            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eef6" />
                  <XAxis dataKey="age" stroke={palette.softGray} />
                  <YAxis stroke={palette.softGray} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={tooltipWrapper} />
                  <Legend />
                  <Bar
                    dataKey="No"
                    stackId="a"
                    animationDuration={1000}
                    fill={palette.medicalLightBlue}
                  />
                  <Bar
                    dataKey="Yes"
                    stackId="a"
                    animationDuration={1000}
                    fill={palette.coral}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* BMI by Exercise*/}
          <Card delay={400} title="BMI by Exercise">
            <div style={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bmiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eef6" />
                  <XAxis dataKey="exercise" stroke={palette.softGray} />
                  <YAxis stroke={palette.softGray} />
                  <Tooltip contentStyle={tooltipStyle} wrapperStyle={tooltipWrapper} />

                  <Bar
                    dataKey="bmi"
                    animationDuration={1100}
                    radius={[8, 8, 0, 0]}
                  >
                    {bmiData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          [
                            palette.medicalBlue,
                            palette.medicalLightBlue,
                            palette.medicalGreen,
                            palette.purpleAccent,
                            palette.coral,
                          ][i % 5]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </main>
      </div>
    </div>
  );
}

/* ---------- Small helpers & styles ---------- */

function Card({ title, children, delay = 0 }) {
  return (
    <div
      className="card-glass"
      style={{
        ...styles.card,
        animationDelay: `${delay}ms`,
      }}
    >
      <h3 style={styles.cardTitle}>{title}</h3>
      {children}
    </div>
  );
}

function StyleBlock() {
  const css = `
    .card-glass {
      transform-origin: center;
      will-change: transform, opacity;
      animation: fadeUp 520ms cubic-bezier(.2,.9,.3,1) both;
      transition: transform 220ms ease, box-shadow 220ms ease;
    }
    .card-glass:hover {
      transform: translateY(-8px);
      box-shadow: 0 24px 48px rgba(15,23,42,0.12), 0 6px 18px rgba(99,102,241,0.06);
      border-color: rgba(15,23,42,0.06);
    }
    .card-glass svg {
      filter: drop-shadow(0 8px 20px rgba(15,23,42,0.06));
    }
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.995);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
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
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    padding: "28px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#0f172a",
  },
  container: {
    maxWidth: 1300,
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: "clamp(28px, 4.5vw, 40px)",
    margin: 0,
    fontWeight: 900,
    letterSpacing: "-0.6px",
  },
  titleGradient: {
    background: "linear-gradient(90deg, #0f766e 0%, #1e3a8a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    display: "inline-block",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#475569",
  },
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(15,23,42,0.06)",
    padding: "8px 12px",
    borderRadius: 10,
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: 600,
  },
  primaryBtn: {
    display: "inline-block",
    textDecoration: "none",
    background: "linear-gradient(90deg,#0f766e,#1e3a8a)",
    color: "white",
    padding: "8px 14px",
    borderRadius: 10,
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    marginTop: 18,
  },
  card: {
    background: "rgba(255,255,255,0.94)",
    borderRadius: 16,
    padding: 18,
    border: "1px solid rgba(15,23,42,0.04)",
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  chartBox: {
    width: "100%",
    height: 300,
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
  },
  loadingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "white",
    padding: 26,
    borderRadius: 14,
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background:
      "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(6,95,70,0.12))",
    boxShadow: "inset 0 0 18px rgba(99,102,241,0.06)",
    animation: "spin 1.4s linear infinite",
  },
  errorCard: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
    textAlign: "center",
  },
};

/* spinner keyframes */
const spinnerKeyframes = `
@keyframes spin {
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
}
`;
// append spinner keyframes once
if (typeof document !== "undefined") {
  const id = "medical-clean-spinner";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.innerHTML = spinnerKeyframes;
    document.head.appendChild(s);
  }
}

export default CardiovascularInsights;
