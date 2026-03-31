const crypto = require('crypto');
const pool = require('../config/db');

const generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const verifyPrescription = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT pr.*,
             (SELECT json_agg(pi.* ORDER BY pi.id)
              FROM prescription_items pi
              WHERE pi.prescription_id = pr.id) AS items
      FROM prescriptions pr
      WHERE pr.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }

    const prescription = result.rows[0];

    const recomputedHash = generateHash({
      patient_id: prescription.patient_id,
      doctor_id: prescription.doctor_id,
      diagnosis: prescription.diagnosis,
      notes: prescription.notes,
      items: prescription.items || []
    });

    const status =
      recomputedHash === prescription.hash ? 'VERIFIED' : 'TAMPERED';

    res.json({
      id: prescription.id,
      status,
      stored_hash: prescription.hash,
      recomputed_hash: recomputedHash
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const verifyReport = async (req, res) => {
  res.json({ message: "Report verification working" }); // simple placeholder
};

const verifyHash = async (req, res) => {
  res.json({ message: "Hash verification working" });
};

module.exports = {
  verifyPrescription,
  verifyReport,
  verifyHash
};