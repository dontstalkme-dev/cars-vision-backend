const express = require('express');
const router = express.Router();
const panierController = require('../controllers/panier.controller');
const { verifierAuthOuGuest } = require('../middleware/auth.middleware');

// US-M1-07: Générer token panier invité
router.post('/guest-token', panierController.genererTokenInvite);

// US-M3-01: Ajouter article au panier
router.post('/items', verifierAuthOuGuest, panierController.ajouterArticle);

// US-M3-02: Voir mon panier
router.get('/', verifierAuthOuGuest, panierController.obtenirPanier);

// US-M3-03: Modifier quantité
router.put('/items/:itemId', verifierAuthOuGuest, panierController.modifierQuantite);

// US-M3-04: Supprimer article
router.delete('/items/:itemId', verifierAuthOuGuest, panierController.supprimerArticle);

// US-M3-05: Vider panier
router.delete('/', verifierAuthOuGuest, panierController.viderPanier);

module.exports = router;
