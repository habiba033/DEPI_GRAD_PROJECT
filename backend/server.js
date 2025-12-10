const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// POSTGRES CONFIG 
const pool = new Pool({
  user: 'postgres',           
  host: 'localhost',
  database: 'MediPredict',    
  password: 'habiba123',  
  port: 5433,
});

app.get('/', (req, res) => {
  res.json({ message: '🚀 MediPredict Backend LIVE!' });
});

// CREATE TABLES (runs automatically)
pool.query(`
  CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    smoking BOOLEAN DEFAULT false,
    latest_risk VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(console.error);

pool.query(`
  CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES patients(patient_id),
    stage VARCHAR(20),
    risk_score DECIMAL(5,4),
    tips TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(console.error);

// ✅ REGISTER (SAVES TO DB)
app.post('/api/register', async (req, res) => {
  try {
    const { username, name, age, password } = req.body;
    const patient_id = `PID-${Date.now()}`;
    
    const result = await pool.query(
      'INSERT INTO patients (patient_id, username, name, age) VALUES ($1, $2, $3, $4) RETURNING *',
      [patient_id, username, name, parseInt(age)]
    );
    
    res.json({ 
      success: true, 
      patient_id,
      profile: result.rows[0]  // ✅ REAL DB DATA
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ GET PATIENT (by username)
app.get('/api/patients/:username', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients WHERE username = $1',
      [req.params.username]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ UPDATE PATIENT (NEW!)
app.put('/api/patients/:patient_id', async (req, res) => {
  try {
    const { name, age, weight, height, smoking } = req.body;
    const result = await pool.query(
      `UPDATE patients SET 
        name = $1, age = $2, weight = $3, height = $4, smoking = $5
        WHERE patient_id = $6 RETURNING *`,
      [name, parseInt(age), weight, height, smoking, req.params.patient_id]
    );
    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE PATIENT
app.delete('/api/patients/:username', async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE username = $1', [req.params.username]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
