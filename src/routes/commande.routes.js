const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commande.controller');
const { verifierAuthentification } = require('../middleware/auth.middleware');

// US-M3-09: Suivre commande (invité - public)
router.get('/track/:trackingToken', commandeController.suivreCommande);

// US-M3-13: Annuler commande invité
router.put('/track/:trackingToken/cancel', commandeController.annulerCommandeInvite);

// US-M3-08: Passer commande invité
router.post('/guest', commandeController.passerCommandeInvite);

// Routes nécessitant authentification
router.use(verifierAuthentification);

// US-M3-07: Passer commande (client connecté)
router.post('/', commandeController.passerCommande);

// US-M3-10: Liste mes commandes
router.get('/', commandeController.mesCommandes);

// US-M3-11: Détails d'une commande
router.get('/:id', commandeController.detailsCommande);

// US-M3-12: Annuler commande
router.put('/:id/cancel', commandeController.annulerCommande);

module.exports = router;
