const express = require('express');
const router = express.Router();
const adminPromotionController = require('../controllers/admin.promotion.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');

// Routes admin
router.post('/create', verifierAdmin, adminPromotionController.creerPromotion);
router.put('/:produit_id', verifierAdmin, adminPromotionController.modifierPromotion);
router.delete('/:produit_id', verifierAdmin, adminPromotionController.desactiverPromotion);

// Route publique
router.get('/active', adminPromotionController.listerPromotions);

module.exports = router;
