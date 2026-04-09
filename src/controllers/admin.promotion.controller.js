const { Produit, AbonneNewsletter } = require('../models');
const { sendNewsletterEmail } = require('../utils/email.utils');
const logger = require('../utils/logger');

// Créer une promotion sur un produit
exports.creerPromotion = async (req, res) => {
    try {
        const { produit_id, reduction_pourcentage, prix_promotion, date_debut_promotion, date_fin_promotion } = req.body;

        if (!produit_id || !reduction_pourcentage) {
            return res.status(400).json({ message: 'produit_id et reduction_pourcentage requis' });
        }

        const produit = await Produit.findByPk(produit_id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        // Vérifier les dates
        const debut = new Date(date_debut_promotion);
        const fin = new Date(date_fin_promotion);
        if (debut >= fin) {
            return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
        }

        // Calculer prix_promotion si non fourni
        let prixPromo = prix_promotion;
        if (!prixPromo) {
            prixPromo = (produit.prix * (100 - reduction_pourcentage) / 100).toFixed(2);
        }

        await produit.update({
            en_promotion: true,
            reduction_pourcentage,
            prix_promotion: prixPromo,
            date_debut_promotion: debut,
            date_fin_promotion: fin
        });

        res.status(200).json({ message: 'Promotion créée', data: produit });

        // Envoyer email aux abonnés newsletter (async, ne bloque pas la réponse)
        try {
            const abonnes = await AbonneNewsletter.findAll({ where: { est_actif: true } });
            if (abonnes.length > 0) {
                const fmtPrice = (p) => new Intl.NumberFormat('fr-FR').format(p);
                const finFormatted = fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

                const contenu = `
                    <h2>🔥 Promotion sur ${produit.nom} !</h2>
                    <p>Profitez d'une réduction de <strong>${reduction_pourcentage}%</strong> sur <strong>${produit.nom}</strong>.</p>
                    <div class="info-box">
                        <p style="margin: 0;"><strong>Prix original :</strong> <span style="text-decoration: line-through;">${fmtPrice(produit.prix)} FCFA</span></p>
                        <p style="margin: 5px 0 0;"><strong>Prix promotionnel :</strong> <span style="color: #e53e3e; font-size: 1.2em; font-weight: bold;">${fmtPrice(prixPromo)} FCFA</span></p>
                        <p style="margin: 5px 0 0; font-size: 0.9em; color: #666;">Offre valable jusqu'au ${finFormatted}</p>
                    </div>
                    <a href="${frontendUrl}/shop/${produit.id}" class="button">Voir le produit</a>
                    <p>Ne manquez pas cette offre !</p>
                    <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
                `;

                for (const abonne of abonnes) {
                    try {
                        await sendNewsletterEmail(
                            abonne.email,
                            `🔥 -${reduction_pourcentage}% sur ${produit.nom} !`,
                            contenu,
                            abonne.token_desabonnement
                        );
                    } catch (emailErr) {
                        logger.error(`Erreur envoi promo newsletter à ${abonne.email}:`, { message: emailErr.message });
                    }
                }
                logger.info(`Newsletter promotion envoyée à ${abonnes.length} abonnés pour ${produit.nom}`);
            }
        } catch (newsletterErr) {
            logger.error('Erreur envoi newsletter promotion:', { message: newsletterErr.message });
        }
    } catch (error) {
        console.error('Erreur création promotion:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Modifier une promotion
exports.modifierPromotion = async (req, res) => {
    try {
        const { produit_id } = req.params;
        const { reduction_pourcentage, prix_promotion, date_debut_promotion, date_fin_promotion } = req.body;

        const produit = await Produit.findByPk(produit_id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        if (!produit.en_promotion) {
            return res.status(400).json({ message: 'Ce produit n\'est pas en promotion' });
        }

        const updates = {};
        if (reduction_pourcentage !== undefined) updates.reduction_pourcentage = reduction_pourcentage;
        if (prix_promotion !== undefined) updates.prix_promotion = prix_promotion;
        if (date_debut_promotion !== undefined) updates.date_debut_promotion = new Date(date_debut_promotion);
        if (date_fin_promotion !== undefined) updates.date_fin_promotion = new Date(date_fin_promotion);

        await produit.update(updates);

        res.status(200).json({ message: 'Promotion modifiée', data: produit });
    } catch (error) {
        console.error('Erreur modification promotion:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Désactiver une promotion
exports.desactiverPromotion = async (req, res) => {
    try {
        const { produit_id } = req.params;

        const produit = await Produit.findByPk(produit_id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        if (!produit.en_promotion) {
            return res.status(400).json({ message: 'Ce produit n\'est pas en promotion' });
        }

        await produit.update({
            en_promotion: false,
            reduction_pourcentage: 0,
            prix_promotion: null,
            date_debut_promotion: null,
            date_fin_promotion: null
        });

        res.status(200).json({ message: 'Promotion désactivée', data: produit });
    } catch (error) {
        console.error('Erreur désactivation promotion:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Lister les promotions actives (public)
exports.listerPromotions = async (req, res) => {
    try {
        const maintenant = new Date();

        const promotions = await Produit.findAll({
            where: {
                en_promotion: true,
                date_debut_promotion: { [require('sequelize').Op.lte]: maintenant },
                date_fin_promotion: { [require('sequelize').Op.gte]: maintenant }
            },
            include: [{ association: 'categorie', attributes: ['id', 'nom', 'slug'] }],
            order: [['reduction_pourcentage', 'DESC']]
        });

        res.status(200).json({
            message: 'Liste des promotions actives',
            total: promotions.length,
            data: promotions
        });
    } catch (error) {
        console.error('Erreur liste promotions:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
