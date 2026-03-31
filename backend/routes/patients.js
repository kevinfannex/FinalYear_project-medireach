const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getPatients, getPatientById, getMyProfile,
  updatePatient, getDoctorStats
} = require('../controllers/patientController');

router.get('/stats', authenticate, authorizeRoles('doctor'), getDoctorStats);
router.get('/me', authenticate, authorizeRoles('patient'), getMyProfile);
router.get('/', authenticate, authorizeRoles('doctor'), getPatients);
router.get('/:id', authenticate, getPatientById);
router.put('/:id', authenticate, updatePatient);

module.exports = router;
