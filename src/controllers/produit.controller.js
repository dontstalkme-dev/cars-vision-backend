const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// US-M2-05: Liste des produits avec filtres (Public)
const obtenirProduits = async (req, res) => {
    try {
        const {
            page = 1,
            limite = 20,
            categorie_id,
            prix_min,
            prix_max,
            disponible,
            tri = 'recent',
            recherche
        } = req.query;

        const offset = (page - 1) * limite;
        const where = { est_actif: true };

        // Filtres
        if (categorie_id) {
            where.categorie_id = categorie_id;
        }

        if (prix_min || prix_max) {
            where.prix = {};
            if (prix_min) where.prix[Op.gte] = parseFloat(prix_min);
            if (prix_max) where.prix[Op.lte] = parseFloat(prix_max);
        }

        if (disponible === 'true') {
            where.stock = { [Op.gt]: 0 };
        }

        if (recherche) {
            where[Op.or] = [
                { nom: { [Op.iLike]: `%${recherche}%` } },
                { description: { [Op.iLike]: `%${recherche}%` } }
            ];
        }

        // Tri
        let order = [];
        switch (tri) {
            case 'prix_asc':
                order = [['prix', 'ASC']];
                break;
            case 'prix_desc':
                order = [['prix', 'DESC']];
                break;
            case 'popularite':
                order = [['nombre_ventes', 'DESC']];
                break;
            case 'note':
                order = [['note_moyenne', 'DESC']];
                break;
            case 'recent':
            default:
                order = [['cree_le', 'DESC']];
                break;
        }

        const { count, rows: produits } = await db.Produit.findAndCountAll({
            where,
            limit: parseInt(limite),
            offset: parseInt(offset),
            order,
            include: [
                {
                    model: db.Categorie,
                    as: 'categorie',
                    attributes: ['id', 'nom', 'slug']
                },
                {
                    model: db.ImageProduit,
                    as: 'images',
                    order: [['ordre', 'ASC']],
                    limit: 1
                }
            ]
        });

        res.json({
            produits,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            }
        });

    } catch (error) {
        logger.error('Erreur obtenir produits:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la récupération des produits'
        });
    }
};

// US-M2-06: Fiche détaillée produit (Public)
const obtenirProduit = async (req, res) => {
    try {
        const { id } = req.params;

        const produit = await db.Produit.findOne({
            where: {
                id,
                est_actif: true
            },
            include: [
                {
                    model: db.Categorie,
                    as: 'categorie',
                    attributes: ['id', 'nom', 'slug']
                },
                {
                    model: db.ImageProduit,
                    as: 'images',
                    order: [['ordre', 'ASC']]
                },
                {
                    model: db.Avis,
                    as: 'avis',
                    where: { statut: 'APPROVED' },
                    required: false,
                    limit: 5,
                    order: [['cree_le', 'DESC']],
                    include: [
                        {
                            model: db.Utilisateur,
                            as: 'utilisateur',
                            attributes: ['prenom', 'nom']
                        }
                    ]
                }
            ]
        });

        if (!produit) {
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        // Incrémenter le nombre de vues
        await produit.increment('nombre_vues');

        res.json(produit);

    } catch (error) {
        logger.error('Erreur obtenir produit:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la récupération du produit'
        });
    }
};

// US-M2-07: Rechercher un produit (Public)
const rechercherProduits = async (req, res) => {
    try {
        const { q, page = 1, limite = 20 } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({
                message: 'La recherche doit contenir au moins 2 caractères'
            });
        }

        const offset = (page - 1) * limite;

        const { count, rows: produits } = await db.Produit.findAndCountAll({
            where: {
                est_actif: true,
                [Op.or]: [
                    { nom: { [Op.iLike]: `%${q}%` } },
                    { description: { [Op.iLike]: `%${q}%` } }
                ]
            },
            limit: parseInt(limite),
            offset: parseInt(offset),
            order: [['nombre_ventes', 'DESC'], ['cree_le', 'DESC']],
            include: [
                {
                    model: db.Categorie,
                    as: 'categorie',
                    attributes: ['id', 'nom', 'slug']
                },
                {
                    model: db.ImageProduit,
                    as: 'images',
                    where: { est_principale: true },
                    required: false,
                    limit: 1
                }
            ]
        });

        res.json({
            resultats: produits,
            recherche: q,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            }
        });

    } catch (error) {
        logger.error('Erreur recherche produits:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la recherche'
        });
    }
};

module.exports = {
    obtenirProduits,
    obtenirProduit,
    rechercherProduits
};
