const { useState, useEffect } = React;

function LabLayout({ onLogout }) {
  const [view, setView] = useState("dashboard");
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-1.5 rounded">Lab</div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">Gamma Labs</h1>
            <span className="text-xs text-slate-500 uppercase font-semibold">Professional Dashboard</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-8">
        {view === "dashboard" ? (
          <LabDashboardHome onNewEntry={() => setView("entry")} />
        ) : (
          <LabDataEntry onBack={() => setView("dashboard")} />
        )}
      </main>
    </div>
  );
}

function LabDashboardHome({ onNewEntry }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, pending: 0 });
  const [loading, setLoading] = useState(true);   // add this

  useEffect(() => {
    fetch('/api/lab/appointments')
      .then(res => res.json())
      .then(data => {
        setRows(data.appointments || []);
        setStats({
          totalPatients: data.total_patients || 0,
          pending: data.pending_count || 0,
        });
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setStats({ totalPatients: 0, pending: 0 });
        setLoading(false);
      });
  }, []);

  const totalAppointments = rows.length;
  const pending = stats.pending;   // use stats

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Lab Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-2">
            Total Appointments
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {totalAppointments}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase mb-2">
            Pending
          </div>
          <div className="text-3xl font-bold text-amber-500">
            {pending}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-700 text-sm uppercase">
            Recent Appointments
          </h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-slate-500 bg-white border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 font-medium">Appointment ID</th>
              <th className="px-6 py-3 font-medium">Patient ID</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                  No appointments found.
                </td>
              </tr>
            )}
            {!loading && rows.map(p => (
              <tr
                key={p.appointment_id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-slate-500">
                  {p.appointment_id}
                </td>
                <td className="px-6 py-4 font-mono text-slate-500">
                  {p.patient_id}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {p.name}
                </td> 
                <td className="px-6 py-4 text-slate-600">
                  {p.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LabDataEntry({ onBack }) {
  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack}>← Back to Dashboard</button>
      {/* form as before */}
    </div>
  );
}

function LabApp() {
  return <LabLayout onLogout={() => { window.location.href = '/'; }} />;
}

const labContainer = document.getElementById('lab-root');
if (labContainer) {
  const labRoot = ReactDOM.createRoot(labContainer);
  labRoot.render(<LabApp />);
}