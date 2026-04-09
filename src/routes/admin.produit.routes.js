const express = require('express');
const router = express.Router();
const adminProduitController = require('../controllers/admin.produit.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// Toutes les routes nécessitent le rôle admin
router.use(verifierAdmin);

// Liste tous les produits (Admin - inclut inactifs)
router.get('/', adminProduitController.obtenirTousProduits);

// Obtenir produits avec stock faible
router.get('/low-stock', adminProduitController.obtenirProduitsStockFaible);

// US-M2-03: Créer un produit
router.post('/', adminProduitController.creerProduit);

// US-M2-04: Ajouter une image à un produit (URL)
router.post('/:id/images', adminProduitController.ajouterImageProduit);

// Upload image produit (fichier)
router.post('/:id/images/upload', uploadSingle, adminProduitController.uploadImageProduit);

// US-M2-08: Modifier un produit
router.put('/:id', adminProduitController.modifierProduit);

// US-M2-09: Mettre à jour le stock
router.patch('/:id/stock', adminProduitController.mettreAJourStock);

// US-M2-10: Désactiver un produit
router.delete('/:id', adminProduitController.desactiverProduit);

module.exports = router;
