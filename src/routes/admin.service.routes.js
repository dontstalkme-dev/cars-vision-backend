const express = require('express');
const router = express.Router();
const adminServiceController = require('../controllers/admin.service.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');
const { uploadServiceImage } = require('../middleware/upload.middleware');

// Toutes les routes nécessitent le rôle admin
router.use(verifierAdmin);

router.post('/', adminServiceController.creerService);
router.get('/', adminServiceController.listerTousServices);
router.put('/:id', adminServiceController.modifierService);
router.delete('/:id', adminServiceController.supprimerService);
router.post('/:id/image', uploadServiceImage, adminServiceController.uploadImageService);

module.exports = router;
