const { ArticleBlog } = require('../models');
const { genererSlugUnique } = require('../utils/slug.utils');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Lister les articles du blog (public)
exports.listerArticles = async (req, res) => {
    try {
        const { page = 1, limit = 10, categorie, search } = req.query;
        const offset = (page - 1) * limit;

        const where = { statut: 'publie' };
        if (search) {
            where[Op.or] = [
                { titre: { [Op.iLike]: `%${search}%` } },
                { contenu: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await ArticleBlog.findAndCountAll({
            where,
            order: [['date_publication', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            message: 'Articles du blog',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        logger.error('Erreur liste articles:', { message: error.message, stack: error.stack });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Voir un article (public)
exports.voirArticle = async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await ArticleBlog.findOne({
            where: { slug, statut: 'publie' }
        });

        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        res.status(200).json({
            message: 'Article',
            data: article
        });
    } catch (error) {
        logger.error('Erreur voir article:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Génère la meta description automatiquement à partir du résumé ou du contenu
const genererMetaDescription = (resume, contenu, titre) => {
    if (resume) return resume.substring(0, 160);
    if (contenu) {
        const texte = contenu.replace(/<[^>]+>/g, '').trim();
        return texte.substring(0, 160);
    }
    return titre.substring(0, 160);
};

// Génère les tags automatiquement à partir du titre
const genererTags = (titre) => {
    const motsIgnores = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'en', 'à', 'au', 'aux', 'pour', 'par', 'sur', 'avec', 'dans', 'son', 'sa', 'ses', 'ce', 'cette', 'ces', 'qui', 'que', 'est', 'sont', 'votre', 'vos', 'nos', 'notre', 'comment', 'pourquoi'];
    return titre
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .split(/[\s,;:!?.'"()\-]+/)
        .filter(mot => mot.length > 2 && !motsIgnores.includes(mot));
};

// Créer un article (admin)
exports.creerArticle = async (req, res) => {
    try {
        const { titre, contenu, resume, image } = req.body;

        if (!titre || !contenu) {
            return res.status(400).json({ message: 'Titre et contenu requis' });
        }

        const slug = await genererSlugUnique(titre, ArticleBlog);

        // Support file upload or URL
        const imageValue = req.file ? `/uploads/blog/${req.file.filename}` : (image || null);

        const article = await ArticleBlog.create({
            titre,
            slug,
            contenu,
            resume: resume || null,
            meta_description: genererMetaDescription(resume, contenu, titre),
            meta_keywords: genererTags(titre).join(', '),
            image: imageValue,
            tags: genererTags(titre),
            auteur_id: req.utilisateur.id,
            statut: 'brouillon'
        });

        res.status(201).json({
            message: 'Article créé',
            data: article
        });
    } catch (error) {
        logger.error('Erreur création article:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Modifier un article (admin)
exports.modifierArticle = async (req, res) => {
    try {
        const { article_id } = req.params;
        const { titre, contenu, resume, image, statut } = req.body;

        const article = await ArticleBlog.findByPk(article_id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        const updates = {};
        if (titre) {
            updates.titre = titre;
            updates.slug = await genererSlugUnique(titre, ArticleBlog, article_id);
            updates.tags = genererTags(titre);
            updates.meta_keywords = genererTags(titre).join(', ');
        }
        if (contenu) updates.contenu = contenu;
        if (resume !== undefined) updates.resume = resume;
        // Auto-generate meta_description from resume or content
        if (resume || contenu || titre) {
            updates.meta_description = genererMetaDescription(
                resume !== undefined ? resume : article.resume,
                contenu || article.contenu,
                titre || article.titre
            );
        }
        // Support file upload or URL
        if (req.file) {
            updates.image = `/uploads/blog/${req.file.filename}`;
        } else if (image !== undefined) {
            updates.image = image;
        }
        if (statut !== undefined) {
            updates.statut = statut;
            if (statut === 'publie' && !article.date_publication) {
                updates.date_publication = new Date();
            }
        }

        await article.update(updates);

        res.status(200).json({
            message: 'Article modifié',
            data: article
        });
    } catch (error) {
        logger.error('Erreur modification article:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Publier un article (admin)
exports.publierArticle = async (req, res) => {
    try {
        const { article_id } = req.params;

        const article = await ArticleBlog.findByPk(article_id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        await article.update({
            statut: 'publie',
            date_publication: new Date()
        });

        res.status(200).json({
            message: 'Article publié',
            data: article
        });
    } catch (error) {
        logger.error('Erreur publication article:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Dépublier un article (admin)
exports.depublierArticle = async (req, res) => {
    try {
        const { article_id } = req.params;

        const article = await ArticleBlog.findByPk(article_id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        await article.update({ statut: 'brouillon' });

        res.status(200).json({
            message: 'Article dépublié',
            data: article
        });
    } catch (error) {
        logger.error('Erreur dépublication article:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Supprimer un article (admin)
exports.supprimerArticle = async (req, res) => {
    try {
        const { article_id } = req.params;

        const article = await ArticleBlog.findByPk(article_id);
        if (!article) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }

        await article.destroy();

        res.status(200).json({
            message: 'Article supprimé'
        });
    } catch (error) {
        logger.error('Erreur suppression article:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Lister les articles brouillons (admin)
exports.listerBrouillons = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await ArticleBlog.findAndCountAll({
            where: { statut: 'brouillon' },
            order: [['modifie_le', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            message: 'Articles brouillons',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        logger.error('Erreur liste brouillons:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Lister TOUS les articles (admin)
exports.tousLesArticles = async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { titre: { [Op.iLike]: `%${search}%` } },
                { contenu: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await ArticleBlog.findAndCountAll({
            where,
            order: [['cree_le', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            message: 'Tous les articles',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        logger.error('Erreur liste tous articles:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Statistiques SEO
exports.statistiquesSEO = async (req, res) => {
    try {
        const totalArticles = await ArticleBlog.count();
        const articlesPublies = await ArticleBlog.count({ where: { statut: 'publie' } });
        const articlesBrouillons = await ArticleBlog.count({ where: { statut: 'brouillon' } });

        const articlesPopulaires = await ArticleBlog.findAll({
            where: { statut: 'publie' },
            order: [['date_publication', 'DESC']],
            limit: 5,
            attributes: ['id', 'titre', 'slug', 'date_publication']
        });

        res.status(200).json({
            message: 'Statistiques SEO',
            data: {
                total_articles: totalArticles,
                articles_publies: articlesPublies,
                articles_brouillons: articlesBrouillons,
                articles_populaires: articlesPopulaires
            }
        });
    } catch (error) {
        logger.error('Erreur statistiques SEO:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
