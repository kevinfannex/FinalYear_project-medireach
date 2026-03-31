const express = require('express');
const router = express.Router();

const verificationController = require('../controllers/verificationController');

router.get('/prescription/:id', verificationController.verifyPrescription);
router.get('/report/:id', verificationController.verifyReport);
router.get('/hash', verificationController.verifyHash);

module.exports = router;