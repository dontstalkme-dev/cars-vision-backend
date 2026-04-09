const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seo.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/metadata/product/:slug', seoController.getMetaDataProduit);
router.get('/metadata/category/:slug', seoController.getMetaDataCategorie);
router.get('/metadata/article/:slug', seoController.getMetaDataArticle);
router.get('/sitemap.xml', seoController.generateSitemap);
router.get('/parameters', seoController.getParametresSEO);

// Routes admin
router.put('/parameters', verifierAdmin, seoController.updateParametresSEO);

module.exports = router;
