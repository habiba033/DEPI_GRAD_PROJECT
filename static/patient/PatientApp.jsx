// static/src/patient.jsx - COMPLETE PATIENT PORTAL

// LAB BRANCHES (Egypt Gamma Labs)
const LAB_BRANCHES = [
    { id: "cairo_main", name: "Gamma Labs - Cairo Main (Maadi)", code: "GCAI-001", lat: 29.9599, lng: 31.2834 },
    { id: "cairo_east", name: "Gamma Labs - Heliopolis", code: "GCAI-002", lat: 30.1229, lng: 31.4074 },
    { id: "giza_dokki", name: "Gamma Labs - Giza (Dokki)", code: "GGIZ-001", lat: 30.0408, lng: 31.2084 },
    { id: "alex_smouha", name: "Gamma Labs - Alexandria (Smouha)", code: "GALX-001", lat: 31.2010, lng: 29.9190 },
    { id: "alex_stanley", name: "Gamma Labs - Stanley Bridge", code: "GALX-002", lat: 31.2083, lng: 29.9800 },
    { id: "mansoura", name: "Gamma Labs - Mansoura Branch", code: "GMAN-001", lat: 31.0409, lng: 31.3783 },
    { id: "luxor", name: "Gamma Labs - Luxor Center", code: "GLUX-001", lat: 25.6872, lng: 32.6396 },
];

// Button Component
function Button({ children, variant = "default", className = "", ...props }) {
    const base = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center";
    const variants = {
        default: "bg-[#0ea5e9] text-white hover:bg-[#0284c7]",
        outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200"
    };
    return React.createElement('button', {
        className: `${base} ${variants[variant]} ${className}`,
        ...props
    }, children);
}

// Input Component
function Input({ label, className = "", ...props }) {
    return React.createElement('div', { className: 'space-y-2' },
        label && React.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, label),
        React.createElement('input', {
            className: `w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent ${className}`,
            ...props
        })
    );
}

// PATIENT LOGIN
function PatientLogin({ onSuccess }) {
    const [formData, setFormData] = React.useState({ username: '', password: '' });
    const [registerMode, setRegisterMode] = React.useState(false);
    const [loading, setLoading] = React.useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username) {
            alert("Please enter a username.");
            return;
        }

        setLoading(true);
        try {
            const endpoint = registerMode
                ? '/api/register'
                : '/api/patients/' + formData.username;
            const method = registerMode ? 'POST' : 'GET';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: registerMode
                    ? JSON.stringify({
                        username: formData.username,
                        name: formData.username,
                        age: 45,
                        password: formData.password
                    })
                    : null
            });

            const data = await response.json();

            if (registerMode) {
                // REGISTER success if data.success and data.patient_id
                if (data.success && data.patient_id) {
                    const userData = {
                        profile: {
                            name: formData.name || formData.username,
                            age: Number(formData.age) || 45,
                            patient_id: data.patient_id
                        },
                        username: formData.username
                    };
                    localStorage.setItem('patient_user', JSON.stringify(userData));
                    onSuccess(userData);
                } else {
                    alert(data.error || 'Registration failed!');
                }
            } else {
                // LOGIN success if backend returned profile + patient_id
                if (data.profile && data.profile.patient_id) {
                    const userData = {
                        profile: data.profile,
                        username: data.username || formData.username
                    };
                    localStorage.setItem('patient_user', JSON.stringify(userData));
                    onSuccess(userData);
                } else {
                    alert(data.error || 'Login failed!');
                }
            }
        } catch (err) {
            alert('Error connecting to server!');
        } finally {
            setLoading(false);
        }
    };

    return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4' },
        React.createElement('div', { className: 'max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6' },
            React.createElement('div', { className: 'text-center' },
                React.createElement('div', { className: 'w-20 h-20 bg-[#0ea5e9] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white' },
                    React.createElement('i', { className: 'ri-user-heart-line text-3xl' })
                ),
                React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 mb-2' }, 'Patient Portal'),
                React.createElement('p', { className: 'text-slate-500' }, registerMode ? 'Create your account' : 'Welcome back')
            ),
            React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
                React.createElement(Input, {
                    label: registerMode ? 'Username' : 'Username or Patient ID',
                    value: formData.username,
                    onChange: (e) => setFormData({ ...formData, username: e.target.value }),
                    placeholder: registerMode ? 'Enter username' : 'demo or test'
                }),
                registerMode && React.createElement(Input, {
                    label: 'Full Name',
                    value: formData.name || '',
                    onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                    placeholder: 'John Doe'
                }),
                registerMode && React.createElement(Input, {
                    label: 'Age',
                    type: 'number',
                    value: formData.age || '',
                    onChange: (e) => setFormData({ ...formData, age: e.target.value }),
                    placeholder: '45'
                }),
                React.createElement(Input, {
                    label: 'Password',
                    type: 'password',
                    value: formData.password,
                    onChange: (e) => setFormData({ ...formData, password: e.target.value }),
                    placeholder: registerMode ? 'Create password' : '123456'
                }),
                React.createElement(Button, {
                    type: 'submit',
                    className: 'w-full',
                    disabled: loading
                },
                    loading ? React.createElement('i', { className: 'ri-loader-4-line animate-spin mr-2' }) : null,
                    registerMode ? 'Create Account' : 'Login'
                )
            ),
            React.createElement('div', { className: 'text-center text-sm text-slate-500 space-y-2' },
                React.createElement('button', {
                    className: 'text-[#0ea5e9] hover:text-[#0284c7] font-medium',
                    onClick: () => setRegisterMode(!registerMode)
                }, registerMode ? 'Already have account? Login' : 'Need account? Register'),
                React.createElement('div', { className: 'text-xs mt-4' },
                    React.createElement('div', null, 'Demo:'),
                    React.createElement('div', null, React.createElement('strong', null, 'test / 123456'))
                )
            )
        )
    );
}

// PATIENT LAYOUT (Sidebar + Views)
function PatientLayout({ user, onLogout }) {
    const [view, setView] = React.useState('profile');

    const SidebarItem = ({ id, icon, label }) => (
        React.createElement('button', {
            onClick: () => setView(id),
            className: `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === id ? 'bg-blue-50 text-[#0ea5e9]' : 'text-slate-600 hover:bg-slate-50'}`
        },
            React.createElement('i', { className: `${icon} text-xl` }),
            label
        )
    );

    const renderView = () => {
        switch (view) {
            case 'profile': return React.createElement(PatientProfile, { user });
            case 'predict': return React.createElement(PatientPredict, { user });
            case 'visuals': return React.createElement(PatientInsights, null);
            case 'labs':
                return React.createElement('div', { className: 'space-y-8' },
                    React.createElement(PatientLabLocator, null),
                    React.createElement(PatientLabBooking, { user })
                );

            default: return React.createElement(PatientProfile, { user });
        }
    };

    return React.createElement('div', { className: 'min-h-screen bg-slate-50 flex' },
        // Sidebar
        React.createElement('aside', { className: 'w-64 bg-white border-r border-slate-200 hidden md:flex flex-col' },
            React.createElement('div', { className: 'p-6 border-b border-slate-100' },
                React.createElement('div', { className: 'font-bold text-lg text-slate-800 flex items-center gap-2' },
                    React.createElement('div', { className: 'w-6 h-6 bg-[#0ea5e9] rounded flex items-center justify-center text-white text-xs' }, 'MP'),
                    'Patient Portal'
                )
            ),
            React.createElement('div', { className: 'p-4 space-y-1 flex-1' },
                React.createElement(SidebarItem, { id: 'profile', icon: 'ri-user-line', label: 'My Profile' }),
                React.createElement(SidebarItem, { id: 'predict', icon: 'ri-heart-pulse-line', label: 'Risk Prediction' }),
                React.createElement(SidebarItem, { id: 'visuals', icon: 'ri-bar-chart-2-line', label: 'Health Insights' }),
                React.createElement(SidebarItem, { id: 'labs', icon: 'ri-map-pin-line', label: 'Find a Lab' })
            ),
            React.createElement('div', { className: 'p-4 border-t border-slate-100' },
                React.createElement('button', {
                    onClick: onLogout,
                    className: 'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-50'
                },
                    React.createElement('i', { className: 'ri-logout-box-line text-xl' }),
                    'Sign Out'
                )
            )
        ),

        // Main Content
        React.createElement('main', { className: 'flex-1 overflow-y-auto' },
            React.createElement('div', { className: 'md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center' },
                React.createElement('span', { className: 'font-bold' }, 'Patient Portal'),
                React.createElement('button', { onClick: onLogout },
                    React.createElement('i', { className: 'ri-logout-box-line' })
                )
            ),
            React.createElement('div', { className: 'p-8' }, renderView())
        )
    );
}
// PATIENT PROFILE
function PatientProfile({ user }) {
    console.log("PatientProfile user =", user);
    const name = user?.profile?.name || 'Patient';
    const username = user?.username || 'user';
    const patientId = user?.profile?.patient_id || 'PID-001';
    const age = user?.profile?.age ?? 'N/A';

    const [editing, setEditing] = React.useState(false);
    const [editData, setEditData] = React.useState({
        name: user?.profile?.name || '',
        age: user?.profile?.age || ''
    });

    const [latestRisk, setLatestRisk] = React.useState(null);
    const [latestClinical, setLatestClinical] = React.useState(null);
    const [lifestyleHistory, setLifestyleHistory] = React.useState([]);
    const [clinicalHistory, setClinicalHistory] = React.useState([]);



    React.useEffect(() => {
        if (!username) return;

        fetch(`/api/patients/${encodeURIComponent(username)}/latest-lifestyle`)
            .then(res => res.json())
            .then(data => { if (data.has_prediction) setLatestRisk(data); })
            .catch(() => { });

        fetch(`/api/patients/${encodeURIComponent(username)}/latest-clinical`)
            .then(res => res.json())
            .then(data => { if (data.has_prediction) setLatestClinical(data); })
            .catch(() => { });

        fetch(`/api/patients/${encodeURIComponent(username)}/lifestyle-history`)
            .then(res => res.json())
            .then(data => setLifestyleHistory(data))
            .catch(() => { });

        fetch(`/api/patients/${encodeURIComponent(username)}/clinical-history`)
            .then(res => res.json())
            .then(data => setClinicalHistory(data))
            .catch(() => { });
    }, [username]);

    return React.createElement('div', { className: 'max-w-3xl space-y-8' },
        React.createElement('h2', { className: 'text-2xl font-bold text-slate-900 mb-6' }, 'My Health Profile'),

        // TOP CARD (unchanged)
        React.createElement('div', { className: 'bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex items-start justify-between' },
            React.createElement('div', { className: 'flex gap-4' },
                React.createElement('div', { className: 'w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-full flex items-center justify-center text-white' },
                    React.createElement('i', { className: 'ri-user-heart-line text-2xl' })
                ),
                React.createElement('div', null,
                    React.createElement('h3', { className: 'text-xl font-bold text-slate-900' }, name),
                    React.createElement('div', { className: 'flex items-center gap-2 mt-1' },
                        React.createElement('p', { className: 'text-sm text-slate-500' }, '@' + username),
                        React.createElement('span', { className: 'text-slate-300' }, '•'),
                        React.createElement('p', { className: 'text-sm font-mono text-[#0ea5e9] bg-blue-50 px-2 py-1 rounded' },
                            patientId
                        )
                    ),
                    React.createElement('div', { className: 'flex gap-3 mt-4' },
                        React.createElement('span', { className: 'px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full' },
                            'Age: ' + age
                        ),
                    )
                )
            ),
            React.createElement(Button, {
                variant: 'outline',
                className: 'text-xs',
                onClick: () => setEditing(true)
            }, 'Edit Details')
        ),

        React.createElement('div', { className: 'bg-emerald-50 p-6 rounded-xl border border-emerald-100' },
            React.createElement('h3', { className: 'font-bold text-emerald-800 mb-4 flex items-center gap-2 text-lg' },
                React.createElement('i', { className: 'ri-check-circle-line text-xl' }),
                'Personalized Recommendations'
            ),
            (latestRisk || latestClinical)
                ? React.createElement('div', null,

                    // Lifestyle block
                    latestRisk && React.createElement('div', { className: 'mb-4' },
                        React.createElement('p', { className: 'text-sm text-emerald-900 mb-1 font-semibold' },
                            'Lifestyle prediction (based on habits):'
                        ),
                        React.createElement('p', { className: 'text-sm text-emerald-900 mb-1' },
                            `Risk: ${latestRisk.risk_prediction} (score: ${latestRisk.prediction_score})`
                        ),
                        latestRisk.profile?.tips && latestRisk.profile.tips.length > 0 &&
                        React.createElement('ul', { className: 'list-disc list-inside text-sm text-emerald-900' },
                            latestRisk.profile.tips.map((t, i) =>
                                React.createElement('li', { key: i }, t)
                            )
                        )
                    ),

                    // Clinical block
                    latestClinical && React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm text-emerald-900 mb-1 font-semibold' },
                            'Clinical prediction (based on lab results):'
                        ),
                        React.createElement('p', { className: 'text-sm text-emerald-900 mb-1' },
                            `Risk: ${latestClinical.risk_prediction} (score: ${latestClinical.prediction_score})`
                        ),
                        latestRisk?.profile?.clinical_tips &&
                        latestRisk.profile.clinical_tips.length > 0 &&
                        React.createElement('ul', { className: 'list-disc list-inside text-sm text-emerald-900' },
                            latestRisk.profile.clinical_tips.map((t, i) =>
                                React.createElement('li', { key: i }, t)
                            )
                        )
                    )
                )
                : React.createElement('p', { className: 'text-sm text-emerald-900' },
                    'Run lifestyle and clinical predictions to see your personalized recommendations here.'
                )
        ),
        // HISTORY SECTION
        React.createElement('div', { className: 'bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4' },
            React.createElement('h3', { className: 'text-lg font-bold text-slate-900' }, 'Prediction History'),

            // Lifestyle history
            React.createElement('div', null,
                React.createElement('h4', { className: 'text-sm font-semibold text-slate-700 mb-2' },
                    'Lifestyle assessments'
                ),
                lifestyleHistory.length > 0
                    ? React.createElement('ul', { className: 'space-y-2 text-sm text-slate-700' },
                        lifestyleHistory.map((item, idx) =>
                            React.createElement('li', { key: idx, className: 'border-b border-slate-100 pb-2' },
                                `${new Date(item.created_at).toLocaleString()} — Risk: ${item.risk_prediction} (score: ${item.prediction_score}), BMI: ${item.bmi}, Smoking: ${item.smoking_history}`
                            )
                        )
                    )
                    : React.createElement('p', { className: 'text-sm text-slate-500' },
                        'No lifestyle assessments yet.'
                    )
            ),

            // Clinical history
            React.createElement('div', null,
                React.createElement('h4', { className: 'text-sm font-semibold text-slate-700 mb-2' },
                    'Clinical assessments'
                ),
                clinicalHistory.length > 0
                    ? React.createElement('ul', { className: 'space-y-2 text-sm text-slate-700' },
                        clinicalHistory.map((item, idx) =>
                            React.createElement('li', { key: idx, className: 'border-b border-slate-100 pb-2' },
                                `${new Date(item.created_at).toLocaleString()} — Risk: ${item.risk_prediction} (score: ${item.prediction_score}), BP: ${item.resting_bp_systolic}, Chol: ${item.cholesterol_mg_dl}`
                            )
                        )
                    )
                    : React.createElement('p', { className: 'text-sm text-slate-500' },
                        'No clinical assessments yet.'
                    )
            )
        ),

        // EDIT FORM (unchanged, is its own card)
        editing && React.createElement('div', {
            className: 'bg-white p-6 rounded-xl shadow-sm border border-slate-200'
        },
            React.createElement('h3', { className: 'text-lg font-bold mb-4' }, 'Edit Profile'),
            React.createElement('div', { className: 'grid md:grid-cols-2 gap-4 mb-4' },
                React.createElement(Input, {
                    label: 'Full Name',
                    value: editData.name,
                    onChange: e => setEditData({ ...editData, name: e.target.value })
                }),
                React.createElement(Input, {
                    label: 'Age',
                    type: 'number',
                    value: editData.age,
                    onChange: e => setEditData({ ...editData, age: e.target.value })
                })
            ),
            React.createElement('div', { className: 'flex gap-3 justify-end' },
                React.createElement(Button, {
                    variant: 'secondary',
                    onClick: () => setEditing(false)
                }, 'Cancel'),
                React.createElement(Button, {
                    onClick: async () => {
                        const updated = {
                            ...user,
                            profile: {
                                ...user.profile,
                                name: editData.name,
                                age: Number(editData.age)
                            }
                        };
                        localStorage.setItem('patient_user', JSON.stringify(updated));
                        window.location.reload();
                    }
                }, 'Save')
            )
        )
    );
}

function PatientInsights() {
    const path = window.location.pathname;

    if (path === "/visuals/cardio") return <CardiovascularInsights />;
    if (path === "/visuals/clinical") return <ClinicalInsights />;

    return (
        <div className="relative min-h-screen px-4 md:px-0 py-12">

            {/* Header */}
            <div className="text-center max-w-4xl mx-auto mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    Health Insights
                </h1>
                <p className="text-lg text-slate-600 mb-2">
                    Explore interactive dashboards summarizing the real-world cardiovascular and clinical datasets used in our AI models.
                </p>
                <p className="text-sm text-slate-500">
                    Analyze risk factors, lab results, and population trends before running your own personalized assessment.
                </p>
            </div>

            {/* Visuals Cards – match Prediction style */}
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Cardiovascular Card */}
                <div
                    className="group bg-white p-6 rounded-xl border border-slate-200 shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all cursor-pointer"
                    onClick={() => window.location.href = "/visuals/cardio"}
                >
                    <div className="w-16 h-16 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <i className="ri-heart-pulse-line text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Cardiovascular</h3>
                    <p className="text-sm text-slate-500">Risk trends & predictions</p>
                </div>

                {/* Clinical Card */}
                <div
                    className="group bg-white p-6 rounded-xl border border-slate-200 shadow-lg hover:shadow-2xl hover:border-emerald-500 transition-all cursor-pointer"
                    onClick={() => window.location.href = "/visuals/clinical"}
                >
                    <div className="w-16 h-16 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <i className="ri-bar-chart-2-line text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Clinical</h3>
                    <p className="text-sm text-slate-500">Lab results & biomarkers</p>
                </div>
            </div>

            {/* Optional stats */}
            <div className="max-w-3xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h4 className="text-xl font-bold text-slate-800">10,000+</h4>
                    <p className="text-sm text-slate-500">Patients Analyzed</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h4 className="text-xl font-bold text-slate-800">150+</h4>
                    <p className="text-sm text-slate-500">Clinical Labs</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h4 className="text-xl font-bold text-slate-800">ACCURATE</h4>
                    <p className="text-sm text-slate-500">AI Models</p>
                </div>
            </div>
        </div>
    );
}

function PatientPredict({ user }) {
    const username = user?.username;
    return (
        <div className="relative min-h-screen px-4 md:px-0 py-12">

            {/* Header */}
            <div className="text-center max-w-4xl mx-auto mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    New Assessment
                </h1>
                <p className="text-lg text-slate-600 mb-2">
                    Choose how you want to estimate your cardiovascular risk.
                </p>
            </div>

            {/* Cards – same layout as Insights */}
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">

                {/* Stage 1 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all cursor-pointer group">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <i className="ri-run-line text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Lifestyle Assessment (Stage 1)</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Quick estimate based on age, weight, smoking and daily habits. No lab results required.
                    </p>
                    <Button
                        variant="outline"
                        className="w-full py-5 text-lg"
                        onClick={() =>
                            window.location.href = `/patient/lifestyle?username=${encodeURIComponent(username)}`
                        }
                    >
                        Start Stage 1
                    </Button>
                </div>

                {/* Stage 2 */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg hover:shadow-2xl hover:border-emerald-500 transition-all cursor-pointer group">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <i className="ri-stethoscope-line text-2xl"></i>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Clinical Assessment (Stage 2)</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Advanced model using your lab results (blood pressure, cholesterol, ECG). Best used after Stage 1.
                    </p>
                    <Button
                        variant="outline"
                        className="w-full py-5 text-lg border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        onClick={() =>
                            window.location.href = `/patient/clinical?username=${encodeURIComponent(username)}`
                        }
                    >
                        Start Stage 2
                    </Button>
                </div>

            </div>
        </div>
    );
}

// LAB LOCATOR (Leaflet Map)
function PatientLabLocator() {
    const mapRef = React.useRef(null);
    const [map, setMap] = React.useState(null);
    const [branches, setBranches] = React.useState([]);
    const [search, setSearch] = React.useState('');

    // Fetch branches from Flask
    React.useEffect(() => {
        fetch('/api/labs')
            .then(res => res.json())
            .then(data => setBranches(data))
            .catch(() => setBranches([]));
    }, []);

    // Init map + markers whenever branches change
    React.useEffect(() => {
        if (typeof window.L === 'undefined' || !mapRef.current || branches.length === 0) return;

        const mapInstance = window.L.map(mapRef.current).setView([30.0444, 31.2357], 6);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapInstance);

        // if you don’t yet have lat/lng in DB, comment this out for now
        branches.forEach(branch => {
            if (branch.lat && branch.lng) {
                window.L.marker([branch.lat, branch.lng]).addTo(mapInstance)
                    .bindPopup(`${branch.name}<br>ID: ${branch.code}`);
            }
        });

        setMap(mapInstance);
        return () => mapInstance.remove();
    }, [branches]);

    const filtered = branches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleBook = (branch) => {
        alert(`We’ll help you book an appointment at ${branch.name} (${branch.code}).`);
    };

    return React.createElement('div', { className: 'max-w-6xl mx-auto p-6 space-y-8' },
        React.createElement('div', { className: 'flex flex-col lg:flex-row justify-between items-start gap-6' },
            React.createElement('div', null,
                React.createElement('h2', { className: 'text-3xl font-bold text-slate-900 mb-2' }, 'Find Gamma Labs'),
                React.createElement('p', { className: 'text-slate-500 text-lg' }, `${branches.length} branches across Egypt`)
            ),
            React.createElement('div', { className: 'flex gap-3 w-full lg:w-auto' },
                React.createElement('input', {
                    className: 'flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0ea5e9]',
                    placeholder: 'Search by city, area, or code...',
                    value: search,
                    onChange: e => setSearch(e.target.value)
                }),
                React.createElement(Button, {
                    className: 'px-6',
                    onClick: () => { }
                }, 'Search')
            )
        ),

        React.createElement('div', { className: 'grid lg:grid-cols-2 gap-8' },
            React.createElement('div', { className: 'bg-white rounded-2xl shadow-xl border overflow-hidden' },
                React.createElement('div', {
                    ref: mapRef,
                    className: 'map-element'
                })
            ),
            React.createElement('div', { className: 'space-y-4' },
                React.createElement('h3', { className: 'text-xl font-bold text-slate-900 mb-6' }, 'All Locations'),
                filtered.map(branch =>
                    React.createElement('div', {
                        key: branch.id,
                        className: 'flex gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-[#0ea5e9] hover:shadow-lg cursor-pointer transition-all',
                        onClick: () => handleBook(branch)
                    },
                        React.createElement('div', { className: 'w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-white' },
                            React.createElement('i', { className: 'ri-hospital-line text-xl' })
                        ),
                        React.createElement('div', { className: 'flex-1' },
                            React.createElement('h4', { className: 'font-semibold text-slate-900' }, branch.name),
                            React.createElement('p', { className: 'text-xs uppercase tracking-wide text-slate-400 mt-1' },
                                branch.location || 'Egypt'
                            ),
                            React.createElement('p', { className: 'text-xs text-slate-500 mt-1' },
                                `Branch code: ${branch.code}`
                            )
                        )
                    )
                )

            )
        )
    );
}
function PatientLabBooking({ user }) {
    const username = user?.username;
    const [labs, setLabs] = React.useState([]);
    const [form, setForm] = React.useState({
        branch_code: '',
        date: '',
        time: ''
    });

    const [status, setStatus] = React.useState(null);

    React.useEffect(() => {
        fetch('/api/labs')
            .then(res => res.json())
            .then(data => setLabs(data))
            .catch(() => { });
    }, []);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    branch_code: form.branch_code,
                    date: form.date,
                    time: form.time
                })

            });
            const data = await res.json();
            if (!res.ok) {
                setStatus(`Error: ${data.error || 'Could not book appointment'}`);
            } else {
                setStatus('Appointment booked successfully.');
                setForm({ branch_id: '', date: '', time: '' });
            }
        } catch {
            setStatus('Network error while booking appointment.');
        }
    };

    return React.createElement('div', { className: 'bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4' },
        React.createElement('h3', { className: 'text-lg font-bold text-slate-900' }, 'Book a Lab Appointment'),
        React.createElement('form', { className: 'space-y-4', onSubmit: handleSubmit },
            React.createElement('div', { className: 'space-y-1' },
                React.createElement('label', { className: 'text-sm font-medium text-slate-700' }, 'Select lab'),
                React.createElement('select', {
                    className: 'w-full border border-slate-300 rounded px-3 py-2 text-sm',
                    value: form.branch_code,
                    onChange: e => handleChange('branch_code', e.target.value),
                    required: true
                },
                    React.createElement('option', { value: '' }, 'Choose a lab'),
                    labs.map(l =>
                        React.createElement('option', { key: l.id, value: l.code },
                            `${l.name} (${l.code})`
                        )
                    )
                )
            ),
            React.createElement('div', { className: 'space-y-1' },
                React.createElement('label', { className: 'text-sm font-medium text-slate-700' }, 'Date'),
                React.createElement('input', {
                    type: 'date',
                    className: 'w-full border border-slate-300 rounded px-3 py-2 text-sm',
                    value: form.date,
                    onChange: e => handleChange('date', e.target.value),
                    required: true
                })
            ),
            React.createElement('div', { className: 'space-y-1' },
                React.createElement('label', { className: 'text-sm font-medium text-slate-700' }, 'Time'),
                React.createElement('input', {
                    type: 'time',
                    className: 'w-full border border-slate-300 rounded px-3 py-2 text-sm',
                    value: form.time,
                    onChange: e => handleChange('time', e.target.value),
                    required: true
                })
            ),
            React.createElement('button', {
                type: 'submit',
                className: 'px-4 py-2 bg-[#0ea5e9] text-white text-sm font-medium rounded-lg hover:bg-sky-600'
            }, 'Book Appointment')
        ),
        status && React.createElement('p', {
            className: 'text-sm',
            style: { color: status.startsWith('Error') ? 'red' : 'green' }
        }, status)
    );
}




// MAIN APP
function PatientApp() {
    const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('patient_user') || 'null'));

    if (!user || !user.profile) {
        return React.createElement(PatientLogin, {
            onSuccess: (userData) => {
                localStorage.setItem('patient_user', JSON.stringify(userData));
                setUser(userData);
            }
        });
    }

    return React.createElement(PatientLayout, {
        user,
        onLogout: () => {
            localStorage.removeItem('patient_user');
            setUser(null);
        }
    });
}

// Mount App
const container = document.getElementById('patient-root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(PatientApp));

// Add CSS for map
const style = document.createElement('style');
style.textContent = `
  .map-element { height: 500px !important; width: 100% !important; }
`;
document.head.appendChild(style);
