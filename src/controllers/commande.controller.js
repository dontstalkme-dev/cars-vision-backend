const db = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sendOrderConfirmationEmail, envoyerEmail } = require('../utils/email.utils');
const logger = require('../utils/logger');

// Générer numéro de commande unique
const genererNumeroCommande = () => {
    const date = new Date();
    const annee = date.getFullYear().toString().slice(-2);
    const mois = (date.getMonth() + 1).toString().padStart(2, '0');
    const jour = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `CMD${annee}${mois}${jour}${random}`;
};

// US-M3-07: Passer commande (client connecté)
const passerCommande = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const utilisateur = req.utilisateur;
        const { adresse_livraison, telephone_livraison, zone_livraison_id, notes } = req.body;

        if (!adresse_livraison || !telephone_livraison || !zone_livraison_id) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Adresse, téléphone et zone de livraison requis'
            });
        }

        // Vérifier que la zone de livraison existe et est active
        const zoneLivraison = await db.ZoneLivraison.findByPk(zone_livraison_id);
        if (!zoneLivraison || !zoneLivraison.est_actif) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Zone de livraison invalide ou inactive'
            });
        }

        // Récupérer le panier (DB ou request body)
        const panier = await db.Panier.findOne({
            where: { utilisateur_id: utilisateur.id },
            include: [
                {
                    model: db.ArticlePanier,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        const panierDB = panier && panier.articles && panier.articles.length > 0;
        const produitsBody = req.body.produits;
        const hasBodyItems = Array.isArray(produitsBody) && produitsBody.length > 0;

        if (!panierDB && !hasBodyItems) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Panier vide'
            });
        }

        // Construire la liste d'articles à commander
        let articlesCommande = [];

        if (panierDB) {
            // Utiliser le panier DB
            for (const article of panier.articles) {
                if (article.quantite > article.produit.stock) {
                    await transaction.rollback();
                    return res.status(400).json({
                        message: `Stock insuffisant pour ${article.produit.nom}. Disponible: ${article.produit.stock}`
                    });
                }
                articlesCommande.push({
                    produit_id: article.produit_id,
                    produit: article.produit,
                    nom_produit: article.produit.nom,
                    quantite: article.quantite,
                    prix: parseFloat(article.prix)
                });
            }
        } else {
            // Fallback: utiliser les produits envoyés depuis le frontend (Zustand cart)
            for (const item of produitsBody) {
                const produit = await db.Produit.findByPk(item.produit_id);
                if (!produit) {
                    await transaction.rollback();
                    return res.status(400).json({ message: `Produit ${item.produit_id} introuvable` });
                }
                if (item.quantite > produit.stock) {
                    await transaction.rollback();
                    return res.status(400).json({
                        message: `Stock insuffisant pour ${produit.nom}. Disponible: ${produit.stock}`
                    });
                }
                articlesCommande.push({
                    produit_id: produit.id,
                    produit,
                    nom_produit: produit.nom,
                    quantite: item.quantite,
                    prix: parseFloat(item.prix_unitaire || produit.prix)
                });
            }
        }

        // Calculer totaux
        const sousTotal = articlesCommande.reduce((sum, a) => sum + (a.prix * a.quantite), 0);
        const fraisLivraison = parseFloat(zoneLivraison.frais_livraison);
        const total = sousTotal + fraisLivraison;

        // Créer la commande
        const commande = await db.Commande.create({
            numero_commande: genererNumeroCommande(),
            utilisateur_id: utilisateur.id,
            adresse_livraison,
            telephone_livraison,
            zone_livraison_id,
            sous_total: sousTotal,
            frais_livraison: fraisLivraison,
            remise: 0,
            total,
            statut: 'EN_ATTENTE',
            methode_paiement: 'cash_on_delivery',
            statut_paiement: 'PENDING',
            notes
        }, { transaction });

        // Créer les articles de commande et décrémenter le stock
        for (const article of articlesCommande) {
            await db.ArticleCommande.create({
                commande_id: commande.id,
                produit_id: article.produit_id,
                nom_produit: article.nom_produit,
                quantite: article.quantite,
                prix: article.prix,
                sous_total: article.prix * article.quantite
            }, { transaction });

            await article.produit.decrement('stock', {
                by: article.quantite,
                transaction
            });

            await article.produit.increment('nombre_ventes', {
                by: article.quantite,
                transaction
            });
        }

        // Vider le panier DB si utilisé
        if (panierDB) {
            await db.ArticlePanier.destroy({
                where: { panier_id: panier.id },
                transaction
            });
        }

        await transaction.commit();

        // Récupérer la commande complète
        const commandeComplete = await db.Commande.findByPk(commande.id, {
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        res.status(201).json({
            message: 'Commande passée avec succès',
            commande: commandeComplete
        });

        // Envoyer email de confirmation (fire-and-forget, ne bloque pas la réponse)
        sendOrderConfirmationEmail(
            utilisateur.email,
            `${utilisateur.prenom} ${utilisateur.nom}`,
            commande.numero_commande,
            total.toFixed(2),
            false
        ).catch(err => logger.error('Erreur envoi email confirmation commande:', err));

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        logger.error('Erreur passer commande:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de la commande',
            error: error.message
        });
    }
};

// US-M3-08: Passer commande invité (sans compte)
const passerCommandeInvite = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const {
            nom_invite,
            email_invite,
            telephone_invite,
            adresse_livraison,
            telephone_livraison,
            zone_livraison_id,
            notes,
            produits
        } = req.body;

        if (!nom_invite || !email_invite || !adresse_livraison || !telephone_livraison || !zone_livraison_id) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Nom, email, adresse, téléphone et zone de livraison sont obligatoires'
            });
        }

        if (!Array.isArray(produits) || produits.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Le panier est vide'
            });
        }

        // Vérifier que la zone de livraison existe et est active
        const zoneLivraison = await db.ZoneLivraison.findByPk(zone_livraison_id);
        if (!zoneLivraison || !zoneLivraison.est_actif) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Zone de livraison invalide ou inactive'
            });
        }

        // Vérifier stock et construire les articles
        let articlesCommande = [];
        for (const item of produits) {
            const produit = await db.Produit.findByPk(item.produit_id);
            if (!produit) {
                await transaction.rollback();
                return res.status(400).json({ message: `Produit ${item.produit_id} introuvable` });
            }
            if (item.quantite > produit.stock) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Stock insuffisant pour ${produit.nom}. Disponible: ${produit.stock}`
                });
            }
            articlesCommande.push({
                produit_id: produit.id,
                produit,
                nom_produit: produit.nom,
                quantite: item.quantite,
                prix: parseFloat(item.prix_unitaire || produit.prix)
            });
        }

        // Calculer totaux
        const sousTotal = articlesCommande.reduce((sum, a) => sum + (a.prix * a.quantite), 0);
        const fraisLivraison = parseFloat(zoneLivraison.frais_livraison);
        const total = sousTotal + fraisLivraison;

        // Générer tracking token
        const trackingToken = uuidv4();
        const lienSuivi = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track/${trackingToken}`;

        // Créer la commande
        const commande = await db.Commande.create({
            numero_commande: genererNumeroCommande(),
            token_suivi: trackingToken,
            nom_invite,
            email_invite,
            telephone_invite: telephone_invite || telephone_livraison,
            adresse_livraison,
            telephone_livraison,
            zone_livraison_id,
            sous_total: sousTotal,
            frais_livraison: fraisLivraison,
            remise: 0,
            total,
            statut: 'EN_ATTENTE',
            methode_paiement: 'cash_on_delivery',
            statut_paiement: 'PENDING',
            notes
        }, { transaction });

        // Créer les articles et décrémenter stock
        for (const article of articlesCommande) {
            await db.ArticleCommande.create({
                commande_id: commande.id,
                produit_id: article.produit_id,
                nom_produit: article.nom_produit,
                quantite: article.quantite,
                prix: article.prix,
                sous_total: article.prix * article.quantite
            }, { transaction });

            await article.produit.decrement('stock', {
                by: article.quantite,
                transaction
            });

            await article.produit.increment('nombre_ventes', {
                by: article.quantite,
                transaction
            });
        }

        await transaction.commit();

        const commandeComplete = await db.Commande.findByPk(commande.id, {
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        res.status(201).json({
            message: 'Commande passée avec succès',
            commande: commandeComplete,
            tracking_token: trackingToken,
            lien_suivi: lienSuivi
        });

        // Envoyer email avec lien de suivi (fire-and-forget)
        sendOrderConfirmationEmail(
            email_invite,
            nom_invite,
            commande.numero_commande,
            total.toFixed(2),
            true,
            trackingToken
        ).catch(err => logger.error('Erreur envoi email confirmation commande invité:', err));

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        logger.error('Erreur commande invité:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de la commande'
        });
    }
};

// US-M3-09: Suivre commande (invité)
const suivreCommande = async (req, res) => {
    try {
        const { trackingToken } = req.params;

        const commande = await db.Commande.findOne({
            // BUG FIX : token_suivi est le bon nom de champ (Commande.js)
            where: { token_suivi: trackingToken },
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        if (!commande) {
            return res.status(404).json({
                message: 'Commande non trouvée'
            });
        }

        res.json({
            numero_commande: commande.numero_commande,
            statut: commande.statut,
            statut_paiement: commande.statut_paiement,
            methode_paiement: commande.methode_paiement,
            total: commande.total,
            adresse_livraison: commande.adresse_livraison,
            articles: commande.articles,
            cree_le: commande.cree_le
        });

    } catch (error) {
        logger.error('Erreur suivi commande:', error);
        res.status(500).json({
            message: 'Erreur lors du suivi de la commande'
        });
    }
};

// US-M3-10: Liste mes commandes (client)
const mesCommandes = async (req, res) => {
    try {
        const utilisateur = req.utilisateur;
        const { page = 1, limite = 20 } = req.query;
        const offset = (page - 1) * limite;

        const { count, rows: commandes } = await db.Commande.findAndCountAll({
            where: { utilisateur_id: utilisateur.id },
            limit: parseInt(limite),
            offset: parseInt(offset),
            order: [['cree_le', 'DESC']],
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        res.json({
            commandes,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            }
        });

    } catch (error) {
        logger.error('Erreur liste commandes:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des commandes'
        });
    }
};

// US-M3-11: Détails commande (client)
const detailsCommande = async (req, res) => {
    try {
        const utilisateur = req.utilisateur;
        const { id } = req.params;

        const commande = await db.Commande.findOne({
            where: {
                id,
                utilisateur_id: utilisateur.id
            },
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        if (!commande) {
            return res.status(404).json({
                message: 'Commande non trouvée'
            });
        }

        res.json(commande);

    } catch (error) {
        logger.error('Erreur détails commande:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération de la commande'
        });
    }
};

// US-M3-12: Annuler commande (client)
const annulerCommande = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const utilisateur = req.utilisateur;
        const { id } = req.params;

        const commande = await db.Commande.findOne({
            where: {
                id,
                utilisateur_id: utilisateur.id
            },
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        if (!commande) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Commande non trouvée'
            });
        }

        // Vérifier le statut
        if (!['EN_ATTENTE', 'CONFIRMEE'].includes(commande.statut)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Impossible d\'annuler une commande déjà expédiée ou livrée'
            });
        }

        // Restituer le stock
        for (const article of commande.articles) {
            await article.produit.increment('stock', {
                by: article.quantite,
                transaction
            });
        }

        // Mettre à jour le statut
        await commande.update({
            statut: 'ANNULEE',
            statut_paiement: 'FAILED'
        }, { transaction });

        await transaction.commit();

        // Envoyer email
        await envoyerEmail({
            destinataire: utilisateur.email,
            sujet: `Commande ${commande.numero_commande} annulée`,
            contenu: `
        Bonjour ${utilisateur.prenom},
        
        Votre commande ${commande.numero_commande} a été annulée avec succès.
        
        Le stock a été restitué.
        
        Cars Vision Auto
      `
        });

        res.json({
            message: 'Commande annulée avec succès',
            commande
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur annulation commande:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'annulation'
        });
    }
};

// US-M3-13: Annuler commande invité
const annulerCommandeInvite = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { trackingToken } = req.params;

        const commande = await db.Commande.findOne({
            // BUG FIX : token_suivi est le bon champ dans le modèle Commande.js
            where: { token_suivi: trackingToken },
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    include: [{ model: db.Produit, as: 'produit' }]
                }
            ]
        });

        if (!commande) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Commande non trouvée'
            });
        }

        // Seules les commandes EN_ATTENTE peuvent être annulées par invité
        if (commande.statut !== 'EN_ATTENTE') {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Impossible d\'annuler cette commande. Contactez-nous.'
            });
        }

        // Restituer le stock
        for (const article of commande.articles) {
            await article.produit.increment('stock', {
                by: article.quantite,
                transaction
            });
        }

        await commande.update({
            statut: 'ANNULEE',
            statut_paiement: 'FAILED'
        }, { transaction });

        await transaction.commit();

        await envoyerEmail({
            destinataire: commande.email_invite,
            sujet: `Commande ${commande.numero_commande} annulée`,
            contenu: `
        Bonjour ${commande.nom_invite},
        
        Votre commande ${commande.numero_commande} a été annulée.
        
        Cars Vision Auto
      `
        });

        res.json({
            message: 'Commande annulée avec succès'
        });

    } catch (error) {
        await transaction.rollback();
        logger.error('Erreur annulation commande invité:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'annulation'
        });
    }
};

module.exports = {
    passerCommande,
    passerCommandeInvite,
    suivreCommande,
    mesCommandes,
    detailsCommande,
    annulerCommande,
    annulerCommandeInvite
};
