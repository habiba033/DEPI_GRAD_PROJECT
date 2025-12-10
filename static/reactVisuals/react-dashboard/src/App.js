import React from "react";
import CardiovascularInsights from "./CardiovascularInsights";
import ClinicalInsights from "./ClinicalInsights";

function App() {
  const path = window.location.pathname;

  if (path === "/visuals/cardio") {
    return <CardiovascularInsights />;
  }
  if (path === "/visuals/clinical") {
    return <ClinicalInsights />;
  }

  // optional menu if they just open /visuals
  return (
    <div style={{ minHeight: "100vh", display: "flex",
                  flexDirection: "column", alignItems: "center",
                  justifyContent: "center" }}>
      <h1>Visual Dashboards</h1>
      <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
        <a href="/visuals/cardio">Cardiovascular Insights</a>
        <a href="/visuals/clinical">Clinical Insights</a>
      </div>
    </div>
  );
}

export default App;

