const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const generateFileHash = (filePath, metadata) => {
  const fileBuffer = fs.readFileSync(filePath);

  return crypto
    .createHash('sha256')
    .update(fileBuffer)
    .update(JSON.stringify(metadata))
    .digest('hex');
};

// GET /api/reports
const getReports = async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'doctor') {
      const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (!docResult.rows[0]) return res.status(404).json({ error: 'Doctor not found.' });
      query = `
        SELECT r.*, u.name AS patient_name, d_user.name AS doctor_name
        FROM reports r
        JOIN patients p ON p.id = r.patient_id
        JOIN users u ON u.id = p.user_id
        JOIN doctors d ON d.id = r.doctor_id
        JOIN users d_user ON d_user.id = d.user_id
        WHERE r.doctor_id = $1
        ORDER BY r.created_at DESC
      `;
      params = [docResult.rows[0].id];
    } else {
      const patResult = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (!patResult.rows[0]) return res.status(404).json({ error: 'Patient not found.' });
      query = `
        SELECT r.*, u.name AS patient_name, d_user.name AS doctor_name
        FROM reports r
        JOIN patients p ON p.id = r.patient_id
        JOIN users u ON u.id = p.user_id
        JOIN doctors d ON d.id = r.doctor_id
        JOIN users d_user ON d_user.id = d.user_id
        WHERE r.patient_id = $1
        ORDER BY r.created_at DESC
      `;
      params = [patResult.rows[0].id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/reports/upload — Upload report (doctor only)
const uploadReport = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const { patient_id, report_type, description } = req.body;
  if (!patient_id || !report_type) {
    return res.status(400).json({ error: 'Patient ID and report type are required.' });
  }

  try {
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (!docResult.rows[0]) return res.status(404).json({ error: 'Doctor not found.' });
    const doctorId = docResult.rows[0].id;

    // Check patient belongs to doctor
    const patCheck = await pool.query(
      'SELECT id FROM patients WHERE id = $1 AND doctor_id = $2',
      [patient_id, doctorId]
    );
    if (patCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Patient not assigned to you.' });
    }

    const filePath = req.file.path;
const hash = generateFileHash(filePath, {
  patient_id,
  doctor_id: doctorId,
  report_type,
  timestamp: null
});
    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(`
      INSERT INTO reports (patient_id, doctor_id, report_type, file_url, file_name, description, hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [patient_id, doctorId, report_type, fileUrl, req.file.originalname, description, hash]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('uploadReport error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/reports/:id
const getReportById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT r.*, u.name AS patient_name, d_user.name AS doctor_name
      FROM reports r
      JOIN patients p ON p.id = r.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = r.doctor_id
      JOIN users d_user ON d_user.id = d.user_id
      WHERE r.id = $1
    `, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/reports/patient/:patientId
const getPatientReports = async (req, res) => {
  const { patientId } = req.params;
  try {
    const result = await pool.query(`
      SELECT r.*, u.name AS patient_name, d_user.name AS doctor_name
      FROM reports r
      JOIN patients p ON p.id = r.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = r.doctor_id
      JOIN users d_user ON d_user.id = d.user_id
      WHERE r.patient_id = $1
      ORDER BY r.created_at DESC
    `, [patientId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// DELETE /api/reports/:id
const deleteReport = async (req, res) => {
  const { id } = req.params;
  try {
    const docResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (!docResult.rows[0]) return res.status(403).json({ error: 'Unauthorized.' });

    const reportResult = await pool.query(
      'SELECT * FROM reports WHERE id = $1 AND doctor_id = $2',
      [id, docResult.rows[0].id]
    );
    if (reportResult.rows.length === 0) return res.status(404).json({ error: 'Report not found.' });

    const filePath = path.join(__dirname, '..', reportResult.rows[0].file_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM reports WHERE id = $1', [id]);
    res.json({ message: 'Report deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getReports, uploadReport, getReportById, getPatientReports, deleteReport };
