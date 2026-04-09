const express = require('express');
const router = express.Router();
const avisController = require('../controllers/avis.controller');
const { verifierAuthentification, verifierAdmin } = require('../middleware/auth.middleware');

// US-M5-02: Lire les avis approuvés (Public)
router.get('/:produit_id/reviews', avisController.obtenirAvisProduit);

// US-M5-06: Voir note moyenne et distribution (Public)
router.get('/:produit_id/reviews/summary', avisController.obtenirResumeProduit);

// Routes nécessitant authentification
router.use(verifierAuthentification);

// US-M5-01: Créer un avis
router.post('/:produit_id/reviews', avisController.creerAvis);

// US-M5-03: Modifier un avis
router.put('/reviews/:avis_id', avisController.modifierAvis);

// Supprimer un avis
router.delete('/reviews/:avis_id', avisController.supprimerAvis);

// Routes admin
router.use(verifierAdmin);

// US-M5-04: Voir avis en attente
router.get('/admin/reviews/pending', avisController.avisEnAttente);

// US-M5-05: Modérer un avis
router.put('/admin/reviews/:avis_id/moderate', avisController.modererAvis);

module.exports = router;
