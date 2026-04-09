const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// US-M1-07: Générer token panier invité
const genererTokenInvite = async (req, res) => {
    try {
        const guestToken = uuidv4();

        // Créer le panier invité avec expiration 7 jours
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const panier = await db.Panier.create({
            token_invite: guestToken,
            expire_le: expiresAt
        });

        res.status(201).json({
            message: 'Token panier invité généré',
            guest_token: guestToken,
            panier_id: panier.id,
            expire_le: expiresAt
        });

    } catch (error) {
        logger.error('Erreur génération token invité:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la génération du token'
        });
    }
};

// US-M3-01: Ajouter produit au panier (invité ou connecté)
const ajouterArticle = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { produit_id, quantite = 1 } = req.body;
        const guestToken = req.headers['x-guest-token'];
        const utilisateur = req.utilisateur;

        if (!produit_id) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'ID du produit requis'
            });
        }

        // Vérifier le produit
        const produit = await db.Produit.findByPk(produit_id);

        if (!produit || !produit.est_actif) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Produit non trouvé ou indisponible'
            });
        }

        // Vérifier le stock
        if (produit.stock < quantite) {
            await transaction.rollback();
            return res.status(400).json({
                message: `Stock insuffisant. Disponible: ${produit.stock}`
            });
        }

        // Trouver ou créer le panier
        let panier;

        if (utilisateur) {
            // Client connecté
            panier = await db.Panier.findOne({
                where: { utilisateur_id: utilisateur.id }
            });

            if (!panier) {
                panier = await db.Panier.create({
                    utilisateur_id: utilisateur.id
                }, { transaction });
            }
        } else if (guestToken) {
            // Invité
            panier = await db.Panier.findOne({
                where: { token_invite: guestToken }
            });

            if (!panier) {
                await transaction.rollback();
                return res.status(404).json({
                    message: 'Panier invité non trouvé. Générez un token d\'abord.'
                });
            }
        } else {
            await transaction.rollback();
            return res.status(401).json({
                message: 'Authentification ou token invité requis'
            });
        }

        // Vérifier si le produit existe déjà dans le panier
        let articlePanier = await db.ArticlePanier.findOne({
            where: {
                panier_id: panier.id,
                produit_id
            }
        });

        if (articlePanier) {
            // Mettre à jour la quantité
            const nouvelleQuantite = articlePanier.quantite + quantite;

            if (nouvelleQuantite > produit.stock) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Stock insuffisant. Maximum: ${produit.stock}`
                });
            }

            await articlePanier.update({
                quantite: nouvelleQuantite
            }, { transaction });
        } else {
            // Créer nouvel article
            articlePanier = await db.ArticlePanier.create({
                panier_id: panier.id,
                produit_id,
                quantite,
                prix: produit.prix
            }, { transaction });
        }

        await transaction.commit();

        // Retourner le panier complet
        const panierComplet = await obtenirPanierComplet(panier.id);

        res.status(201).json({
            message: 'Produit ajouté au panier',
            panier: panierComplet
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur ajout article:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de l\'ajout au panier'
        });
    }
};

// US-M3-02: Voir mon panier
const obtenirPanier = async (req, res) => {
    try {
        const guestToken = req.headers['x-guest-token'];
        const utilisateur = req.utilisateur;

        let panier;

        if (utilisateur) {
            panier = await db.Panier.findOne({
                where: { utilisateur_id: utilisateur.id }
            });
        } else if (guestToken) {
            panier = await db.Panier.findOne({
                where: { token_invite: guestToken }
            });
        } else {
            return res.status(401).json({
                message: 'Authentification ou token invité requis'
            });
        }

        if (!panier) {
            return res.json({
                panier: null,
                articles: [],
                total: 0,
                message: 'Panier vide'
            });
        }

        const panierComplet = await obtenirPanierComplet(panier.id);

        res.json(panierComplet);

    } catch (error) {
        logger.error('Erreur obtenir panier:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la récupération du panier'
        });
    }
};

// US-M3-03: Modifier quantité article
const modifierQuantite = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { itemId } = req.params;
        const { quantite } = req.body;
        const guestToken = req.headers['x-guest-token'];
        const utilisateur = req.utilisateur;

        if (!quantite || quantite < 1) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Quantité invalide (minimum 1)'
            });
        }

        // Trouver l'article
        const article = await db.ArticlePanier.findByPk(itemId, {
            include: [
                { model: db.Panier, as: 'panier' },
                { model: db.Produit, as: 'produit' }
            ]
        });

        if (!article) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Article non trouvé dans le panier'
            });
        }

        // Vérifier que c'est bien son panier
        const estSonPanier = utilisateur
            ? article.panier.utilisateur_id === utilisateur.id
            : article.panier.token_invite === guestToken;

        if (!estSonPanier) {
            await transaction.rollback();
            return res.status(403).json({
                message: 'Accès refusé'
            });
        }

        // Vérifier le stock
        if (quantite > article.produit.stock) {
            await transaction.rollback();
            return res.status(400).json({
                message: `Stock insuffisant. Disponible: ${article.produit.stock}`
            });
        }

        // Mettre à jour
        await article.update({ quantite }, { transaction });

        await transaction.commit();

        const panierComplet = await obtenirPanierComplet(article.panier_id);

        res.json({
            message: 'Quantité mise à jour',
            panier: panierComplet
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur modification quantité:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la modification'
        });
    }
};

// US-M3-04: Supprimer article du panier
const supprimerArticle = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { itemId } = req.params;
        const guestToken = req.headers['x-guest-token'];
        const utilisateur = req.utilisateur;

        const article = await db.ArticlePanier.findByPk(itemId, {
            include: [{ model: db.Panier, as: 'panier' }]
        });

        if (!article) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Article non trouvé'
            });
        }

        // Vérifier que c'est bien son panier
        const estSonPanier = utilisateur
            ? article.panier.utilisateur_id === utilisateur.id
            : article.panier.token_invite === guestToken;

        if (!estSonPanier) {
            await transaction.rollback();
            return res.status(403).json({
                message: 'Accès refusé'
            });
        }

        const panierId = article.panier_id;
        await article.destroy({ transaction });

        await transaction.commit();

        const panierComplet = await obtenirPanierComplet(panierId);

        res.json({
            message: 'Article supprimé du panier',
            panier: panierComplet
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur suppression article:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors de la suppression'
        });
    }
};

// US-M3-05: Vider le panier
const viderPanier = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const guestToken = req.headers['x-guest-token'];
        const utilisateur = req.utilisateur;

        let panier;

        if (utilisateur) {
            panier = await db.Panier.findOne({
                where: { utilisateur_id: utilisateur.id }
            });
        } else if (guestToken) {
            panier = await db.Panier.findOne({
                where: { token_invite: guestToken }
            });
        } else {
            await transaction.rollback();
            return res.status(401).json({
                message: 'Authentification ou token invité requis'
            });
        }

        if (!panier) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Panier non trouvé'
            });
        }

        await db.ArticlePanier.destroy({
            where: { panier_id: panier.id },
            transaction
        });

        await transaction.commit();

        res.json({
            message: 'Panier vidé avec succès',
            panier: {
                id: panier.id,
                articles: [],
                total: 0
            }
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur vider panier:', { message: error.message });
        res.status(500).json({
            message: 'Erreur lors du vidage du panier'
        });
    }
};

// Fonction utilitaire pour obtenir le panier complet
const obtenirPanierComplet = async (panierId) => {
    const panier = await db.Panier.findByPk(panierId, {
        include: [
            {
                model: db.ArticlePanier,
                as: 'articles',
                include: [
                    {
                        model: db.Produit,
                        as: 'produit',
                        include: [
                            {
                                model: db.ImageProduit,
                                as: 'images',
                                where: { est_principale: true },
                                required: false,
                                limit: 1
                            }
                        ]
                    }
                ]
            }
        ]
    });

    if (!panier) return null;

    // Calculer le total
    const total = panier.articles.reduce((sum, article) => {
        return sum + (parseFloat(article.prix) * article.quantite);
    }, 0);

    // Vérifier les alertes de stock
    const alertes = panier.articles
        .filter(article => article.quantite > article.produit.stock)
        .map(article => ({
            produit_id: article.produit_id,
            nom: article.produit.nom,
            quantite_demandee: article.quantite,
            stock_disponible: article.produit.stock,
            message: 'Stock insuffisant'
        }));

    return {
        id: panier.id,
        articles: panier.articles,
        total,
        nombre_articles: panier.articles.length,
        alertes: alertes.length > 0 ? alertes : null
    };
};

module.exports = {
    genererTokenInvite,
    ajouterArticle,
    obtenirPanier,
    modifierQuantite,
    supprimerArticle,
    viderPanier
};
