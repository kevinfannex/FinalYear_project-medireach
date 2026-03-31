const pool = require('../config/db');

// GET /api/patients — Doctor gets their assigned patients
const getPatients = async (req, res) => {
  try {
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }
    const doctorId = doctorResult.rows[0].id;

    const result = await pool.query(`
      SELECT p.id, p.age, p.gender, p.blood_group, p.phone, p.address, p.created_at,
             u.name, u.email,
             (SELECT COUNT(*) FROM prescriptions pr WHERE pr.patient_id = p.id) AS prescription_count,
             (SELECT COUNT(*) FROM reports r WHERE r.patient_id = p.id) AS report_count
      FROM patients p
      JOIN users u ON u.id = p.user_id
      WHERE p.doctor_id = $1
      ORDER BY u.name ASC
    `, [doctorId]);

    res.json(result.rows);
  } catch (err) {
    console.error('getPatients error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/patients/:id — Get single patient (doctor must own, or patient viewing self)
const getPatientById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.id, p.age, p.gender, p.blood_group, p.phone, p.address, p.doctor_id, p.created_at,
             u.name, u.email
      FROM patients p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const patient = result.rows[0];

    // Authorization check
    if (req.user.role === 'patient') {
      const patientCheck = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (!patientCheck.rows[0] || patientCheck.rows[0].id !== parseInt(id)) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (req.user.role === 'doctor') {
      const doctorCheck = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (!doctorCheck.rows[0] || doctorCheck.rows[0].id !== patient.doctor_id) {
        return res.status(403).json({ error: 'Access denied. Not your patient.' });
      }
    }

    res.json(patient);
  } catch (err) {
    console.error('getPatientById error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/patients/me — Patient gets their own profile
const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.age, p.gender, p.blood_group, p.phone, p.address, p.doctor_id, p.created_at,
             u.name, u.email,
             d_user.name AS doctor_name,
             doc.specialization
      FROM patients p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN doctors doc ON doc.id = p.doctor_id
      LEFT JOIN users d_user ON d_user.id = doc.user_id
      WHERE p.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /api/patients/:id — Update patient
const updatePatient = async (req, res) => {
  const { id } = req.params;
  const { age, gender, blood_group, phone, address, doctor_id } = req.body;
  try {
    const result = await pool.query(`
      UPDATE patients SET age=$1, gender=$2, blood_group=$3, phone=$4, address=$5, doctor_id=$6
      WHERE id=$7 RETURNING *
    `, [age, gender, blood_group, phone, address, doctor_id, id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/patients/stats — Doctor dashboard stats
const getDoctorStats = async (req, res) => {
  try {
    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (doctorResult.rows.length === 0) return res.status(404).json({ error: 'Doctor not found.' });
    const doctorId = doctorResult.rows[0].id;

    const [patients, prescriptions, reports] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM patients WHERE doctor_id = $1', [doctorId]),
      pool.query('SELECT COUNT(*) FROM prescriptions WHERE doctor_id = $1', [doctorId]),
      pool.query('SELECT COUNT(*) FROM reports WHERE doctor_id = $1', [doctorId])
    ]);

    // Recent activity
    const recentPrescriptions = await pool.query(`
      SELECT pr.id, pr.diagnosis, pr.created_at, u.name AS patient_name
      FROM prescriptions pr
      JOIN patients p ON p.id = pr.patient_id
      JOIN users u ON u.id = p.user_id
      WHERE pr.doctor_id = $1
      ORDER BY pr.created_at DESC LIMIT 5
    `, [doctorId]);

    // Monthly prescription counts for chart
    const monthlyData = await pool.query(`
      SELECT TO_CHAR(created_at, 'Mon') AS month, 
             EXTRACT(MONTH FROM created_at) AS month_num,
             COUNT(*) AS count
      FROM prescriptions
      WHERE doctor_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, month_num
      ORDER BY month_num
    `, [doctorId]);

    res.json({
      stats: {
        patients: parseInt(patients.rows[0].count),
        prescriptions: parseInt(prescriptions.rows[0].count),
        reports: parseInt(reports.rows[0].count)
      },
      recentPrescriptions: recentPrescriptions.rows,
      monthlyData: monthlyData.rows
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getPatients, getPatientById, getMyProfile, updatePatient, getDoctorStats };
