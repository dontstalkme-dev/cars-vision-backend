const express = require('express');
const router = express.Router();
const adminZoneController = require('../controllers/admin.zone.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent le rôle admin
router.use(verifierAdmin);

router.post('/', adminZoneController.creerZone);
router.get('/', adminZoneController.listerToutesZones);
router.put('/:id', adminZoneController.modifierZone);
router.delete('/:id', adminZoneController.supprimerZone);

module.exports = router;
