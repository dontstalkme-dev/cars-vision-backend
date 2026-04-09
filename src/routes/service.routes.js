const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');

// Routes publiques
router.get('/', serviceController.listerServicesActifs);
router.get('/:slug', serviceController.obtenirService);

module.exports = router;
