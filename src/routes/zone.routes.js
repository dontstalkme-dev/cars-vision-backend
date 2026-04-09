const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zone.controller');

// Route publique
router.get('/', zoneController.listerZonesActives);

module.exports = router;
