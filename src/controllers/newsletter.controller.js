const { AbonneNewsletter } = require('../models');
const { sendEmail, sendNewsletterEmail, getEmailTemplate } = require('../utils/email.utils');
const logger = require('../utils/logger');

// S'abonner à la newsletter
exports.sAbonner = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email requis' });
        }

        // Vérifier si déjà abonné
        const existant = await AbonneNewsletter.findOne({ where: { email } });
        if (existant) {
            if (existant.est_actif) {
                return res.status(400).json({ message: 'Cet email est déjà abonné' });
            }
            // Réactiver l'abonnement
            await existant.update({ est_actif: true, consentement_date: new Date() });
            return res.status(200).json({ message: 'Abonnement réactivé', data: existant });
        }

        // Créer nouvel abonné
        const abonne = await AbonneNewsletter.create({ email });

        // Envoyer email de confirmation
        const content = `
            <h2>Bienvenue à notre newsletter ! 📧</h2>
            <p>Merci de vous être abonné à la newsletter Cars Vision Auto.</p>
            <p>Vous recevrez désormais nos dernières offres, promotions et actualités directement dans votre boîte mail.</p>
            <div class="info-box">
                <p style="margin: 0;"><strong>Ce que vous recevrez :</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Promotions exclusives</li>
                    <li>Nouveaux produits</li>
                    <li>Conseils d'entretien automobile</li>
                </ul>
            </div>
            <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
        `;
        // Utiliser getEmailTemplate de email.utils.js (fix #13 : plus de duplication)
        await sendEmail(email, 'Bienvenue à la newsletter Cars Vision Auto', getEmailTemplate(content));

        res.status(201).json({ message: 'Abonnement réussi', data: abonne });
    } catch (error) {
        logger.error('Erreur abonnement newsletter:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Se désabonner de la newsletter
exports.seDesabonner = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email requis' });
        }

        const abonne = await AbonneNewsletter.findOne({ where: { email } });
        if (!abonne) {
            return res.status(404).json({ message: 'Email non trouvé' });
        }

        await abonne.update({ est_actif: false });

        // Envoyer email de confirmation
        const content = `
            <h2>Désabonnement confirmé</h2>
            <p>Vous avez été désabonné de notre newsletter.</p>
            <p>Nous sommes désolés de vous voir partir. Si vous changez d'avis, vous pouvez vous réabonner à tout moment.</p>
            <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
        `;
        // Utiliser getEmailTemplate de email.utils.js (fix #13 : plus de duplication)
        await sendEmail(email, 'Désabonnement de la newsletter', getEmailTemplate(content));

        res.status(200).json({ message: 'Désabonnement réussi' });
    } catch (error) {
        logger.error('Erreur désabonnement newsletter:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Lister tous les abonnés (admin)
exports.listerAbonnes = async (req, res) => {
    try {
        const abonnes = await AbonneNewsletter.findAll({
            where: { est_actif: true },
            order: [['cree_le', 'DESC']]
        });

        res.status(200).json({
            message: 'Liste des abonnés',
            total: abonnes.length,
            data: abonnes
        });
    } catch (error) {
        logger.error('Erreur liste abonnés:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Envoyer une newsletter à tous les abonnés (admin)
exports.envoyerNewsletter = async (req, res) => {
    try {
        const { sujet, contenu } = req.body;

        if (!sujet || !contenu) {
            return res.status(400).json({ message: 'Sujet et contenu requis' });
        }

        // Récupérer tous les abonnés actifs
        const abonnes = await AbonneNewsletter.findAll({
            where: { est_actif: true }
        });

        if (abonnes.length === 0) {
            return res.status(400).json({ message: 'Aucun abonné actif' });
        }

        // Envoyer l'email à tous les abonnés
        let envoyes = 0;
        let erreurs = 0;

        for (const abonne of abonnes) {
            try {
                await sendNewsletterEmail(abonne.email, sujet, contenu, abonne.token_desabonnement);
                envoyes++;
            } catch (error) {
                logger.error(`Erreur envoi à ${abonne.email}:`, { message: error.message });
                erreurs++;
            }
        }

        res.status(200).json({
            message: 'Newsletter envoyée',
            data: {
                total_abonnes: abonnes.length,
                envoyes,
                erreurs
            }
        });
    } catch (error) {
        logger.error('Erreur envoi newsletter:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
