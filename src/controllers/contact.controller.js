const { sendEmail, getEmailTemplate } = require('../utils/email.utils');
const logger = require('../utils/logger');

exports.envoyerMessageContact = async (req, res) => {
    try {
        const { nom, email, telephone, sujet, message } = req.body;

        if (!nom || !email || !message) {
            return res.status(400).json({ message: 'Nom, email et message sont requis' });
        }

        // Email à l'admin
        const adminEmail = process.env.EMAIL_USER || process.env.CONTACT_EMAIL;
        const htmlContent = getEmailTemplate(`
            <h2>Nouveau message de contact</h2>
            <table style="width:100%; border-collapse:collapse;">
                <tr><td style="padding:8px; font-weight:bold;">Nom</td><td style="padding:8px;">${nom}</td></tr>
                <tr><td style="padding:8px; font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
                ${telephone ? `<tr><td style="padding:8px; font-weight:bold;">Téléphone</td><td style="padding:8px;">${telephone}</td></tr>` : ''}
                ${sujet ? `<tr><td style="padding:8px; font-weight:bold;">Sujet</td><td style="padding:8px;">${sujet}</td></tr>` : ''}
            </table>
            <h3>Message :</h3>
            <p style="white-space:pre-wrap;">${message}</p>
        `, 'Nouveau message de contact');

        sendEmail(adminEmail, `[Contact] ${sujet || 'Message de ' + nom}`, htmlContent)
            .catch(err => logger.error('Erreur envoi email contact:', err));

        res.status(200).json({ message: 'Message envoyé avec succès' });
    } catch (error) {
        logger.error('Erreur contact:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
    }
};
