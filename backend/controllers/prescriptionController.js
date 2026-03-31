const crypto = require('crypto');
const pool = require('../config/db');

const generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const generateShareToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// GET /api/prescriptions — Get prescriptions (doctor: their patients', patient: own)
const getPrescriptions = async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'doctor') {
      const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (!docResult.rows[0]) return res.status(404).json({ error: 'Doctor not found.' });
      const doctorId = docResult.rows[0].id;

      query = `
        SELECT pr.*, u.name AS patient_name, d_user.name AS doctor_name,
               (SELECT json_agg(pi.*) FROM prescription_items pi WHERE pi.prescription_id = pr.id) AS items
        FROM prescriptions pr
        JOIN patients p ON p.id = pr.patient_id
        JOIN users u ON u.id = p.user_id
        JOIN doctors d ON d.id = pr.doctor_id
        JOIN users d_user ON d_user.id = d.user_id
        WHERE pr.doctor_id = $1
        ORDER BY pr.created_at DESC
      `;
      params = [doctorId];
    } else {
      const patResult = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (!patResult.rows[0]) return res.status(404).json({ error: 'Patient not found.' });
      const patientId = patResult.rows[0].id;

      query = `
        SELECT pr.*, u.name AS patient_name, d_user.name AS doctor_name,
               doc.specialization,
               (SELECT json_agg(pi.*) FROM prescription_items pi WHERE pi.prescription_id = pr.id) AS items
        FROM prescriptions pr
        JOIN patients p ON p.id = pr.patient_id
        JOIN users u ON u.id = p.user_id
        JOIN doctors d ON d.id = pr.doctor_id
        JOIN users d_user ON d_user.id = d.user_id
        LEFT JOIN doctors doc ON doc.id = pr.doctor_id
        WHERE pr.patient_id = $1
        ORDER BY pr.created_at DESC
      `;
      params = [patientId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getPrescriptions error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/prescriptions/:id
const getPrescriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT pr.*, u.name AS patient_name, d_user.name AS doctor_name,
             doc.specialization,
             (SELECT json_agg(pi.* ORDER BY pi.id) FROM prescription_items pi WHERE pi.prescription_id = pr.id) AS items
      FROM prescriptions pr
      JOIN patients p ON p.id = pr.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = pr.doctor_id
      JOIN users d_user ON d_user.id = d.user_id
      LEFT JOIN doctors doc ON doc.id = pr.doctor_id
      WHERE pr.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Prescription not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/prescriptions/share/:token — Public shared prescription
const getSharedPrescription = async (req, res) => {
  const { token } = req.params;
  try {
    const result = await pool.query(`
      SELECT pr.id, pr.diagnosis, pr.notes, pr.created_at, pr.hash,
             u.name AS patient_name,
             d_user.name AS doctor_name,
             doc.specialization,
             (SELECT json_agg(pi.* ORDER BY pi.id) FROM prescription_items pi WHERE pi.prescription_id = pr.id) AS items
      FROM prescriptions pr
      JOIN patients p ON p.id = pr.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = pr.doctor_id
      JOIN users d_user ON d_user.id = d.user_id
      LEFT JOIN doctors doc ON doc.id = pr.doctor_id
      WHERE pr.share_token = $1
    `, [token]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Shared prescription not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/prescriptions — Create prescription (doctor only)
const createPrescription = async (req, res) => {
  const { patient_id, diagnosis, notes, items } = req.body;

  if (!patient_id || !diagnosis) {
    return res.status(400).json({ error: 'Patient ID and diagnosis are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const docResult = await client.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (!docResult.rows[0]) return res.status(404).json({ error: 'Doctor not found.' });
    const doctorId = docResult.rows[0].id;

    // Verify patient belongs to this doctor
    const patCheck = await client.query(
      'SELECT id FROM patients WHERE id = $1 AND doctor_id = $2',
      [patient_id, doctorId]
    );
    if (patCheck.rows.length === 0) {
      return res.status(403).json({ error: 'This patient is not assigned to you.' });
    }

    const shareToken = generateShareToken();
const hashData = {
  patient_id,
  doctor_id: doctorId,
  diagnosis,
  notes,
  items: items || [],
  timestamp: null
};    const hash = generateHash(hashData);

    const prescResult = await client.query(`
      INSERT INTO prescriptions (patient_id, doctor_id, diagnosis, notes, hash, share_token)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [patient_id, doctorId, diagnosis, notes, hash, shareToken]);

    const prescription = prescResult.rows[0];

    // Insert prescription items
    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(`
          INSERT INTO prescription_items (prescription_id, medicine_name, dosage, duration, frequency, instructions)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [prescription.id, item.medicine_name, item.dosage, item.duration, item.frequency, item.instructions]);
      }
    }

    await client.query('COMMIT');

    // Fetch full prescription with items
    const fullResult = await pool.query(`
      SELECT pr.*, u.name AS patient_name, d_user.name AS doctor_name,
             (SELECT json_agg(pi.*) FROM prescription_items pi WHERE pi.prescription_id = pr.id) AS items
      FROM prescriptions pr
      JOIN patients p ON p.id = pr.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = pr.doctor_id
      JOIN users d_user ON d_user.id = d.user_id
      WHERE pr.id = $1
    `, [prescription.id]);

    res.status(201).json(fullResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createPrescription error:', err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    client.release();
  }
};

// DELETE /api/prescriptions/:id
const deletePrescription = async (req, res) => {
  const { id } = req.params;
  try {
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (!docResult.rows[0]) return res.status(404).json({ error: 'Doctor not found.' });

    const result = await pool.query(
      'DELETE FROM prescriptions WHERE id = $1 AND doctor_id = $2 RETURNING id',
      [id, docResult.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prescription not found or unauthorized.' });
    res.json({ message: 'Prescription deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/prescriptions/:id/share — Generate share token
const sharePrescription = async (req, res) => {
  const { id } = req.params;
  try {
    const patResult = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (!patResult.rows[0]) return res.status(404).json({ error: 'Patient not found.' });

    const result = await pool.query(
      'SELECT share_token FROM prescriptions WHERE id = $1 AND patient_id = $2',
      [id, patResult.rows[0].id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prescription not found.' });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/prescription/${result.rows[0].share_token}`;
    res.json({ share_token: result.rows[0].share_token, share_url: shareUrl });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/prescriptions/patient/:patientId
const getPatientPrescriptions = async (req, res) => {
  const { patientId } = req.params;
  try {
    const result = await pool.query(`
      SELECT pr.*, u.name AS patient_name, d_user.name AS doctor_name,
             (SELECT json_agg(pi.* ORDER BY pi.id) FROM prescription_items pi WHERE pi.prescription_id = pr.id) AS items
      FROM prescriptions pr
      JOIN patients p ON p.id = pr.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = pr.doctor_id
      JOIN users d_user ON d_user.id = d.user_id
      WHERE pr.patient_id = $1
      ORDER BY pr.created_at DESC
    `, [patientId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  getPrescriptions, getPrescriptionById, createPrescription,
  deletePrescription, sharePrescription, getSharedPrescription,
  getPatientPrescriptions
};
