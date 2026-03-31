const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getReports, uploadReport, getReportById,
  getPatientReports, deleteReport
} = require('../controllers/reportController');

router.get('/patient/:patientId', authenticate, getPatientReports);
router.get('/', authenticate, getReports);
router.get('/:id', authenticate, getReportById);
router.post('/upload', authenticate, authorizeRoles('doctor'), upload.single('file'), uploadReport);
router.delete('/:id', authenticate, authorizeRoles('doctor'), deleteReport);

module.exports = router;
