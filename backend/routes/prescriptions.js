const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getPrescriptions, getPrescriptionById, createPrescription,
  deletePrescription, sharePrescription, getSharedPrescription,
  getPatientPrescriptions
} = require('../controllers/prescriptionController');

router.get('/shared/:token', getSharedPrescription);
router.get('/patient/:patientId', authenticate, getPatientPrescriptions);
router.get('/', authenticate, getPrescriptions);
router.get('/:id', authenticate, getPrescriptionById);
router.post('/', authenticate, authorizeRoles('doctor'), createPrescription);
router.delete('/:id', authenticate, authorizeRoles('doctor'), deletePrescription);
router.post('/:id/share', authenticate, authorizeRoles('patient'), sharePrescription);

module.exports = router;
