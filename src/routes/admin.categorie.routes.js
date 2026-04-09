const express = require('express');
const router = express.Router();
const adminCategorieController = require('../controllers/admin.categorie.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent le rôle admin
router.use(verifierAdmin);

// US-M2-01: Créer une catégorie
router.post('/', adminCategorieController.creerCategorie);

// Modifier une catégorie
router.put('/:id', adminCategorieController.modifierCategorie);

// Supprimer une catégorie
router.delete('/:id', adminCategorieController.supprimerCategorie);

module.exports = router;
