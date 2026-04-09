const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorie.controller');

// US-M2-02: Voir toutes les catégories (Public)
router.get('/', categorieController.obtenirCategories);

module.exports = router;
