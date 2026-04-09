const db = require('../models');
const { Op } = require('sequelize');

// US-M5-01: Laisser un avis sur un produit acheté (Client)
const creerAvis = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const utilisateur = req.utilisateur;
        const { produit_id } = req.params;
        const { note, commentaire } = req.body;

        // Validation
        if (!note || note < 1 || note > 5) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Note invalide (doit être entre 1 et 5)'
            });
        }

        if (commentaire && commentaire.length < 10) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Le commentaire doit contenir au moins 10 caractères'
            });
        }

        // Vérifier que le produit existe
        const produit = await db.Produit.findByPk(produit_id);
        if (!produit) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        // Vérifier que l'utilisateur a une commande LIVREE contenant ce produit
        const commande = await db.Commande.findOne({
            where: {
                utilisateur_id: utilisateur.id,
                statut: 'LIVREE'
            },
            include: [
                {
                    model: db.ArticleCommande,
                    as: 'articles',
                    where: { produit_id },
                    required: true
                }
            ]
        });

        if (!commande) {
            await transaction.rollback();
            return res.status(403).json({
                message: 'Vous devez avoir acheté et reçu ce produit pour laisser un avis'
            });
        }

        // Vérifier qu'il n'existe pas déjà un avis de cet utilisateur pour ce produit
        const avisExistant = await db.Avis.findOne({
            where: {
                produit_id,
                utilisateur_id: utilisateur.id
            }
        });

        if (avisExistant) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Vous avez déjà laissé un avis pour ce produit'
            });
        }

        // Créer l'avis
        const avis = await db.Avis.create({
            produit_id,
            utilisateur_id: utilisateur.id,
            note,
            commentaire: commentaire || null,
            statut: 'PENDING'
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: 'Avis créé avec succès. En attente de modération.',
            avis
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur création avis:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de l\'avis'
        });
    }
};

// US-M5-02: Lire les avis approuvés d'un produit (Public)
const obtenirAvisProduit = async (req, res) => {
    try {
        const { produit_id } = req.params;
        const { page = 1, limite = 10, tri = 'recent' } = req.query;
        const offset = (page - 1) * limite;

        // Vérifier que le produit existe
        const produit = await db.Produit.findByPk(produit_id);
        if (!produit) {
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        // Déterminer l'ordre
        let order = [];
        switch (tri) {
            case 'note_haute':
                order = [['note', 'DESC']];
                break;
            case 'note_basse':
                order = [['note', 'ASC']];
                break;
            case 'recent':
            default:
                order = [['cree_le', 'DESC']];
                break;
        }

        const { count, rows: avis } = await db.Avis.findAndCountAll({
            where: {
                produit_id,
                statut: 'APPROVED'
            },
            limit: parseInt(limite),
            offset: parseInt(offset),
            order,
            include: [
                {
                    model: db.Utilisateur,
                    as: 'utilisateur',
                    attributes: ['prenom', 'nom']
                }
            ]
        });

        res.json({
            avis,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            },
            tri
        });

    } catch (error) {
        console.error('Erreur obtenir avis:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des avis'
        });
    }
};

// US-M5-03: Modifier ou supprimer mon avis (Client)
const modifierAvis = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const utilisateur = req.utilisateur;
        const { avis_id } = req.params;
        const { note, commentaire } = req.body;

        const avis = await db.Avis.findByPk(avis_id);

        if (!avis) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Avis non trouvé'
            });
        }

        // Vérifier que c'est son avis
        if (avis.utilisateur_id !== utilisateur.id) {
            await transaction.rollback();
            return res.status(403).json({
                message: 'Accès refusé'
            });
        }

        // Validation
        if (note && (note < 1 || note > 5)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Note invalide'
            });
        }

        if (commentaire && commentaire.length < 10) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Le commentaire doit contenir au moins 10 caractères'
            });
        }

        // Mettre à jour
        const donneesAMettreAJour = {};
        if (note) donneesAMettreAJour.note = note;
        if (commentaire !== undefined) donneesAMettreAJour.commentaire = commentaire || null;

        // Remettre en PENDING pour modération
        donneesAMettreAJour.statut = 'PENDING';

        await avis.update(donneesAMettreAJour, { transaction });

        await transaction.commit();

        // BUG FIX : reload pour retourner les données à jour (pas l'ancienne version)
        await avis.reload();

        res.json({
            message: 'Avis modifié. En attente de modération.',
            avis
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur modification avis:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification'
        });
    }
};

// Supprimer mon avis (Client)
const supprimerAvis = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const utilisateur = req.utilisateur;
        const { avis_id } = req.params;

        const avis = await db.Avis.findByPk(avis_id);

        if (!avis) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Avis non trouvé'
            });
        }

        if (avis.utilisateur_id !== utilisateur.id) {
            await transaction.rollback();
            return res.status(403).json({
                message: 'Accès refusé'
            });
        }

        const produit_id = avis.produit_id;
        await avis.destroy({ transaction });

        // Recalculer la note moyenne du produit
        await recalculerNoteMoyenne(produit_id, transaction);

        await transaction.commit();

        res.json({
            message: 'Avis supprimé avec succès'
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur suppression avis:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression'
        });
    }
};

// US-M5-04: Voir les avis en attente de modération (Admin)
const avisEnAttente = async (req, res) => {
    try {
        const { page = 1, limite = 20 } = req.query;
        const offset = (page - 1) * limite;

        const { count, rows: avis } = await db.Avis.findAndCountAll({
            where: { statut: 'PENDING' },
            limit: parseInt(limite),
            offset: parseInt(offset),
            order: [['cree_le', 'ASC']],
            include: [
                {
                    model: db.Utilisateur,
                    as: 'utilisateur',
                    attributes: ['prenom', 'nom', 'email']
                },
                {
                    model: db.Produit,
                    as: 'produit',
                    attributes: ['id', 'nom', 'slug']
                }
            ]
        });

        res.json({
            avis,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            }
        });

    } catch (error) {
        console.error('Erreur avis en attente:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des avis'
        });
    }
};

// US-M5-05: Approuver ou rejeter un avis (Admin)
const modererAvis = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { avis_id } = req.params;
        const { statut } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(statut)) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Statut invalide (APPROVED ou REJECTED)'
            });
        }

        const avis = await db.Avis.findByPk(avis_id);

        if (!avis) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Avis non trouvé'
            });
        }

        await avis.update({ statut }, { transaction });

        // Recalculer la note moyenne du produit
        await recalculerNoteMoyenne(avis.produit_id, transaction);

        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Modération avis: ${statut}`,
            type_action: 'autre',
            details: {
                avis_id: avis.id,
                produit_id: avis.produit_id,
                statut
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: `Avis ${statut === 'APPROVED' ? 'approuvé' : 'rejeté'}`,
            avis
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur modération avis:', error);
        res.status(500).json({
            message: 'Erreur lors de la modération'
        });
    }
};

// US-M5-06: Voir note moyenne et distribution (Public)
const obtenirResumeProduit = async (req, res) => {
    try {
        const { produit_id } = req.params;

        const produit = await db.Produit.findByPk(produit_id);

        if (!produit) {
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        // Récupérer la distribution des notes
        const distribution = await db.sequelize.query(`
      SELECT note, COUNT(*) as nombre
      FROM avis
      WHERE produit_id = :produit_id AND statut = 'APPROVED'
      GROUP BY note
      ORDER BY note DESC
    `, {
            replacements: { produit_id },
            type: db.sequelize.QueryTypes.SELECT
        });

        // Formater la distribution
        const distributionFormatee = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

        distribution.forEach(d => {
            distributionFormatee[d.note] = parseInt(d.nombre);
        });

        res.json({
            produit_id,
            nom_produit: produit.nom,
            note_moyenne: parseFloat(produit.note_moyenne) || 0,
            nombre_avis_total: produit.nombre_avis,
            distribution: distributionFormatee
        });

    } catch (error) {
        console.error('Erreur résumé produit:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération du résumé'
        });
    }
};

// Fonction utilitaire pour recalculer la note moyenne
const recalculerNoteMoyenne = async (produit_id, transaction) => {
    const resultat = await db.sequelize.query(`
    SELECT 
      AVG(note) as moyenne,
      COUNT(*) as total
    FROM avis
    WHERE produit_id = :produit_id AND statut = 'APPROVED'
  `, {
        replacements: { produit_id },
        type: db.sequelize.QueryTypes.SELECT,
        transaction
    });

    const moyenne = resultat[0].moyenne ? parseFloat(resultat[0].moyenne).toFixed(1) : 0;
    const total = resultat[0].total || 0;

    await db.Produit.update(
        {
            note_moyenne: moyenne,
            nombre_avis: total
        },
        {
            where: { id: produit_id },
            transaction
        }
    );
};

module.exports = {
    creerAvis,
    obtenirAvisProduit,
    modifierAvis,
    supprimerAvis,
    avisEnAttente,
    modererAvis,
    obtenirResumeProduit
};
