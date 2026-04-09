const { Produit, Categorie, ArticleBlog, Parametres, ImageProduit } = require('../models');
const logger = require('../utils/logger');

// Obtenir les métadonnées SEO d'une page produit
exports.getMetaDataProduit = async (req, res) => {
    try {
        const { slug } = req.params;

        const produit = await Produit.findOne({
            where: { slug, est_actif: true },
            include: [{ association: 'categorie', attributes: ['nom'] }]
        });

        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        const metaData = {
            title: `${produit.nom} - Cars Vision Auto`,
            description: produit.description ? produit.description.substring(0, 160) : `Achetez ${produit.nom} chez Cars Vision Auto`,
            keywords: `${produit.nom}, ${produit.categorie?.nom || 'pièces auto'}, voiture`,
            image: produit.images && produit.images.length > 0 ? produit.images[0].url : null,
            url: `/products/${slug}`,
            price: produit.prix,
            rating: produit.note_moyenne,
            reviews: produit.nombre_avis
        };

        res.status(200).json({
            message: 'Métadonnées produit',
            data: metaData
        });
    } catch (error) {
        logger.error('Erreur métadonnées produit:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Obtenir les métadonnées SEO d'une page catégorie
exports.getMetaDataCategorie = async (req, res) => {
    try {
        const { slug } = req.params;

        const categorie = await Categorie.findOne({ where: { slug } });
        if (!categorie) {
            return res.status(404).json({ message: 'Catégorie non trouvée' });
        }

        const metaData = {
            title: `${categorie.nom} - Cars Vision Auto`,
            description: categorie.description ? categorie.description.substring(0, 160) : `Découvrez notre sélection de ${categorie.nom}`,
            keywords: `${categorie.nom}, pièces auto, voiture`,
            url: `/categories/${slug}`
        };

        res.status(200).json({
            message: 'Métadonnées catégorie',
            data: metaData
        });
    } catch (error) {
        logger.error('Erreur métadonnées catégorie:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Obtenir les métadonnées SEO d'un article blog
exports.getMetaDataArticle = async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await ArticleBlog.findOne({
            where: { slug, est_publie: true }
        });

        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        const metaData = {
            title: article.titre,
            description: article.meta_description || article.contenu.substring(0, 160),
            keywords: article.meta_keywords || '',
            image: article.image_url,
            url: `/blog/${slug}`,
            author: 'Cars Vision Auto',
            publishedDate: article.date_publication,
            views: article.nombre_vues
        };

        res.status(200).json({
            message: 'Métadonnées article',
            data: metaData
        });
    } catch (error) {
        logger.error('Erreur métadonnées article:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Générer un sitemap XML
exports.generateSitemap = async (req, res) => {
    try {
        const produits = await Produit.findAll({
            where: { est_actif: true },
            attributes: ['slug', 'modifie_le']
        });

        const categories = await Categorie.findAll({
            attributes: ['slug', 'modifie_le']
        });

        const articles = await ArticleBlog.findAll({
            where: { est_publie: true },
            attributes: ['slug', 'modifie_le']
        });

        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // URLs statiques
        sitemap += '  <url>\n    <loc>https://carsvisionauto.cm/</loc>\n    <priority>1.0</priority>\n  </url>\n';
        sitemap += '  <url>\n    <loc>https://carsvisionauto.cm/products</loc>\n    <priority>0.9</priority>\n  </url>\n';
        sitemap += '  <url>\n    <loc>https://carsvisionauto.cm/blog</loc>\n    <priority>0.8</priority>\n  </url>\n';

        // Produits
        produits.forEach(p => {
            sitemap += '  <url>\n';
            sitemap += `    <loc>https://carsvisionauto.cm/products/${p.slug}</loc>\n`;
            sitemap += `    <lastmod>${p.modifie_le.toISOString().split('T')[0]}</lastmod>\n`;
            sitemap += '    <priority>0.8</priority>\n';
            sitemap += '  </url>\n';
        });

        // Catégories
        categories.forEach(c => {
            sitemap += '  <url>\n';
            sitemap += `    <loc>https://carsvisionauto.cm/categories/${c.slug}</loc>\n`;
            sitemap += `    <lastmod>${c.modifie_le.toISOString().split('T')[0]}</lastmod>\n`;
            sitemap += '    <priority>0.7</priority>\n';
            sitemap += '  </url>\n';
        });

        // Articles
        articles.forEach(a => {
            sitemap += '  <url>\n';
            sitemap += `    <loc>https://carsvisionauto.cm/blog/${a.slug}</loc>\n`;
            sitemap += `    <lastmod>${a.modifie_le.toISOString().split('T')[0]}</lastmod>\n`;
            sitemap += '    <priority>0.7</priority>\n';
            sitemap += '  </url>\n';
        });

        sitemap += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        logger.error('Erreur génération sitemap:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Obtenir les paramètres SEO globaux
exports.getParametresSEO = async (req, res) => {
    try {
        const parametres = await Parametres.findAll({
            where: {
                cle: ['seo_titre_site', 'seo_description_site', 'seo_keywords_site', 'seo_google_analytics']
            }
        });

        const seoParams = {};
        parametres.forEach(p => {
            seoParams[p.cle] = p.valeur;
        });

        res.status(200).json({
            message: 'Paramètres SEO',
            data: seoParams
        });
    } catch (error) {
        logger.error('Erreur paramètres SEO:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Mettre à jour les paramètres SEO globaux (admin)
exports.updateParametresSEO = async (req, res) => {
    try {
        const { seo_titre_site, seo_description_site, seo_keywords_site, seo_google_analytics } = req.body;

        const updates = [
            { cle: 'seo_titre_site', valeur: seo_titre_site },
            { cle: 'seo_description_site', valeur: seo_description_site },
            { cle: 'seo_keywords_site', valeur: seo_keywords_site },
            { cle: 'seo_google_analytics', valeur: seo_google_analytics }
        ];

        for (const update of updates) {
            if (update.valeur) {
                const param = await Parametres.findOne({ where: { cle: update.cle } });
                if (param) {
                    await param.update({ valeur: update.valeur });
                } else {
                    await Parametres.create(update);
                }
            }
        }

        res.status(200).json({
            message: 'Paramètres SEO mis à jour'
        });
    } catch (error) {
        logger.error('Erreur mise à jour paramètres SEO:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
