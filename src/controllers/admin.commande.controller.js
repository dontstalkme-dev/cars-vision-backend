const { Commande, ArticleCommande, Utilisateur, Produit, ZoneLivraison } = require('../models');
const { sendOrderStatusEmail, sendInvoiceEmail } = require('../utils/email.utils');
const { genererFacturePDF } = require('../utils/invoice.utils');

// Lister toutes les commandes
exports.listerCommandes = async (req, res) => {
    try {
        const { statut, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (statut) where.statut = statut;

        const { count, rows } = await Commande.findAndCountAll({
            where,
            include: [
                { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'prenom', 'nom', 'email', 'telephone'] }
            ],
            order: [['cree_le', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            message: 'Liste des commandes',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        console.error('Erreur liste commandes:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Voir détails d'une commande
exports.detailsCommande = async (req, res) => {
    try {
        const { commande_id } = req.params;

        const commande = await Commande.findByPk(commande_id, {
            include: [
                { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'email', 'telephone'] },
                { model: ArticleCommande, as: 'articles', include: [{ model: Produit, as: 'produit' }] }
            ]
        });

        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }

        res.status(200).json({
            message: 'Détails commande',
            data: commande
        });
    } catch (error) {
        console.error('Erreur détails commande:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Modifier le statut d'une commande
exports.modifierStatutCommande = async (req, res) => {
    try {
        const { commande_id } = req.params;
        const { statut } = req.body;

        const statuts_valides = ['EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
        if (!statuts_valides.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const commande = await Commande.findByPk(commande_id, {
            include: [
                { model: Utilisateur, as: 'utilisateur' },
                { model: ArticleCommande, as: 'articles', include: [{ model: Produit, as: 'produit' }] }
            ]
        });

        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }

        // Empêcher le retour à un statut antérieur
        const statusOrder = { 'EN_ATTENTE': 0, 'CONFIRMEE': 1, 'EXPEDIEE': 2, 'LIVREE': 3, 'ANNULEE': 4 };
        const currentLevel = statusOrder[commande.statut];
        const newLevel = statusOrder[statut];

        if (commande.statut === 'ANNULEE') {
            return res.status(400).json({ message: 'Impossible de modifier une commande annulée' });
        }
        if (commande.statut === 'LIVREE' && statut !== 'LIVREE') {
            return res.status(400).json({ message: 'Impossible de modifier une commande déjà livrée' });
        }
        if (statut !== 'ANNULEE' && newLevel < currentLevel) {
            return res.status(400).json({ message: 'Impossible de revenir à un statut antérieur' });
        }

        const ancien_statut = commande.statut;
        const updateData = { statut };

        // Auto-marquer le paiement comme PAID quand la commande est livrée
        if (statut === 'LIVREE' && commande.statut_paiement !== 'PAID') {
            updateData.statut_paiement = 'PAID';
        }

        await commande.update(updateData);

        // Déterminer l'email et le nom du destinataire (client connecté ou invité)
        const destinataireEmail = commande.utilisateur
            ? commande.utilisateur.email
            : commande.email_invite;
        const destinataireNom = commande.utilisateur
            ? `${commande.utilisateur.prenom || ''} ${commande.utilisateur.nom || ''}`.trim()
            : commande.nom_invite;

        // Envoyer email de notification (fire-and-forget)
        if (destinataireEmail) {
            sendOrderStatusEmail(
                destinataireEmail,
                destinataireNom,
                commande.numero_commande,
                statut
            ).catch(err => console.error('Erreur envoi email statut:', err));
        }

        // Générer et envoyer la facture PDF quand la commande passe à LIVREE
        if (statut === 'LIVREE' && destinataireEmail) {
            genererFacturePDF(commande)
                .then(pdfBuffer => {
                    return sendInvoiceEmail(
                        destinataireEmail,
                        destinataireNom,
                        commande.numero_commande,
                        pdfBuffer
                    );
                })
                .then(() => console.log(`✓ Facture envoyée pour commande ${commande.numero_commande}`))
                .catch(err => console.error('Erreur génération/envoi facture:', err));
        }

        res.status(200).json({
            message: 'Statut commande modifié',
            data: {
                commande_id,
                ancien_statut,
                nouveau_statut: statut,
                statut_paiement: updateData.statut_paiement || commande.statut_paiement
            }
        });
    } catch (error) {
        console.error('Erreur modification statut:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Modifier le statut de paiement
exports.modifierStatutPaiement = async (req, res) => {
    try {
        const { commande_id } = req.params;
        const { statut_paiement } = req.body;

        const statuts_valides = ['PENDING', 'PAID', 'FAILED'];
        if (!statuts_valides.includes(statut_paiement)) {
            return res.status(400).json({ message: 'Statut de paiement invalide' });
        }

        const commande = await Commande.findByPk(commande_id, {
            include: [{ model: Utilisateur, as: 'utilisateur' }]
        });

        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }

        const ancien_statut = commande.statut_paiement;
        await commande.update({ statut_paiement });

        res.status(200).json({
            message: 'Statut paiement modifié',
            data: {
                commande_id,
                ancien_statut,
                nouveau_statut: statut_paiement
            }
        });
    } catch (error) {
        console.error('Erreur modification paiement:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
