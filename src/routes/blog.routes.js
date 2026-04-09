const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');
const { uploadBlogImage } = require('../middleware/upload.middleware');

// Routes publiques
router.get('/', blogController.listerArticles);
router.get('/:slug', blogController.voirArticle);

// Routes admin
router.get('/admin/all', verifierAdmin, blogController.tousLesArticles);
router.post('/admin/create', verifierAdmin, uploadBlogImage, blogController.creerArticle);
router.put('/admin/:article_id', verifierAdmin, uploadBlogImage, blogController.modifierArticle);
router.put('/admin/:article_id/publier', verifierAdmin, blogController.publierArticle);
router.put('/admin/:article_id/depublier', verifierAdmin, blogController.depublierArticle);
router.delete('/admin/:article_id', verifierAdmin, blogController.supprimerArticle);
router.get('/admin/brouillons', verifierAdmin, blogController.listerBrouillons);
router.get('/admin/stats', verifierAdmin, blogController.statistiquesSEO);

module.exports = router;
