const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');

// Routes publiques
router.post('/subscribe', newsletterController.sAbonner);
router.post('/unsubscribe', newsletterController.seDesabonner);

// Routes admin
router.get('/admin/subscribers', verifierAdmin, newsletterController.listerAbonnes);
router.post('/admin/send', verifierAdmin, newsletterController.envoyerNewsletter);

module.exports = router;
