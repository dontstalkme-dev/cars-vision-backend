const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produit.controller');

// US-M2-07: Rechercher des produits (Public)
router.get('/search', produitController.rechercherProduits);

// US-M2-05: Liste des produits avec filtres (Public)
router.get('/', produitController.obtenirProduits);

// US-M2-06: Fiche détaillée produit (Public)
router.get('/:id', produitController.obtenirProduit);

module.exports = router;
