const nodemailer = require('nodemailer');

// Configuration du transporteur Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  // Accepter les certificats auto-signés en développement
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// Template HTML de base
const getEmailTemplate = (content, title = 'Cars Vision Auto') => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            color: #e0e0e0;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: #1e3c72;
            font-size: 22px;
            margin-top: 0;
        }
        .button {
            display: inline-block;
            padding: 14px 30px;
            margin: 20px 0;
            background-color: #1e3c72;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #2a5298;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #1e3c72;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
        }
        .footer a {
            color: #1e3c72;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
        .highlight {
            color: #1e3c72;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🚗 Cars Vision Auto</h1>
            <p>Votre partenaire automobile à Douala</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>Cars Vision Auto</strong></p>
            <p>Douala, Cameroun</p>
            <p>Email: ${process.env.EMAIL_USER || 'contact@carsvisionauto.cm'}</p>
            <p style="margin-top: 15px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Visiter notre site</a>
            </p>
            <p style="margin-top: 10px; color: #999;">
                © ${new Date().getFullYear()} Cars Vision Auto. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>
    `;
};

// Fonction générique d'envoi d'email
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Cars Vision Auto <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Email envoyé:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Erreur envoi email:', error);
    throw error;
  }
};

// Templates spécifiques

// 1. Email de bienvenue (inscription)
const sendWelcomeEmail = async (email, nom) => {
  const content = `
        <h2>Bienvenue chez Cars Vision Auto ! 🎉</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Nous sommes ravis de vous accueillir parmi nos clients !</p>
        <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
        <div class="info-box">
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Parcourir notre catalogue de pièces automobiles</li>
                <li>Passer des commandes en ligne</li>
                <li>Prendre rendez-vous pour l'entretien de votre véhicule</li>
                <li>Suivre vos commandes en temps réel</li>
            </ul>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" class="button">Découvrir nos produits</a>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;
  return sendEmail(email, 'Bienvenue chez Cars Vision Auto', getEmailTemplate(content));
};

// 2. Email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, nom, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const content = `
        <h2>Réinitialisation de votre mot de passe 🔐</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        <div class="info-box">
            <p style="margin: 0;"><strong>⚠️ Important :</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce lien expire dans <strong>1 heure</strong></li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
            </ul>
        </div>
        <p style="color: #666; font-size: 14px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${resetUrl}" style="color: #1e3c72; word-break: break-all;">${resetUrl}</a></p>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;
  return sendEmail(email, 'Réinitialisation de votre mot de passe', getEmailTemplate(content));
};

// 3. Confirmation de changement de mot de passe
const sendPasswordChangedEmail = async (email, nom) => {
  const content = `
        <h2>Mot de passe modifié ✓</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Votre mot de passe a été modifié avec succès.</p>
        <div class="info-box">
            <p style="margin: 0;"><strong>⚠️ Vous n'êtes pas à l'origine de cette modification ?</strong></p>
            <p style="margin: 10px 0 0 0;">Contactez-nous immédiatement pour sécuriser votre compte.</p>
        </div>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;
  return sendEmail(email, 'Mot de passe modifié', getEmailTemplate(content));
};

// 4. Email de création de compte backoffice
const sendBackofficeAccountEmail = async (email, nom, motDePasse, role) => {
  const content = `
        <h2>Votre compte backoffice 👤</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Un compte backoffice a été créé pour vous sur Cars Vision Auto.</p>
        <div class="info-box">
            <p style="margin: 0;"><strong>Vos identifiants :</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Email :</strong> ${email}</li>
                <li><strong>Mot de passe temporaire :</strong> ${motDePasse}</li>
                <li><strong>Rôle :</strong> ${role === 'admin' ? 'Administrateur' : 'Client'}</li>
            </ul>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Se connecter</a>
        <p><strong>⚠️ Important :</strong> Changez votre mot de passe dès votre première connexion.</p>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;
  return sendEmail(email, 'Votre compte Cars Vision Auto', getEmailTemplate(content));
};

// 5. Email de confirmation de commande
const sendOrderConfirmationEmail = async (email, nom, numeroCommande, montantTotal, isGuest = false, trackingToken = null) => {
  const trackingUrl = isGuest && trackingToken
    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/track-order?token=${trackingToken}`
    : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders`;

  const content = `
        <h2>Commande confirmée ! 🎉</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Nous avons bien reçu votre commande.</p>
        <div class="info-box">
            <p style="margin: 0;"><strong>Détails de votre commande :</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Numéro :</strong> ${numeroCommande}</li>
                <li><strong>Montant total :</strong> ${montantTotal} FCFA</li>
                <li><strong>Mode de paiement :</strong> Paiement à la livraison</li>
            </ul>
        </div>
        <a href="${trackingUrl}" class="button">Suivre ma commande</a>
        <p>Nous vous tiendrons informé de l'avancement de votre commande par email.</p>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;
  return sendEmail(email, `Commande ${numeroCommande} confirmée`, getEmailTemplate(content));
};

// 6. Email de mise à jour de statut de commande
const sendOrderStatusEmail = async (email, nom, numeroCommande, statut) => {
  const statusMessages = {
    'EN_ATTENTE': { emoji: '⏳', title: 'En attente de confirmation', message: 'Votre commande est en cours de traitement.' },
    'CONFIRMEE': { emoji: '✓', title: 'Confirmée', message: 'Votre commande a été confirmée et sera bientôt expédiée.' },
    'EXPEDIEE': { emoji: '📦', title: 'Expédiée', message: 'Votre commande est en route vers vous !' },
    'LIVREE': { emoji: '🎉', title: 'Livrée', message: 'Votre commande a été livrée. Merci de votre confiance !' },
    'ANNULEE': { emoji: '❌', title: 'Annulée', message: 'Votre commande a été annulée.' }
  };

  const statusInfo = statusMessages[statut] || statusMessages['EN_ATTENTE'];

  const content = `
        <h2>Mise à jour de votre commande ${statusInfo.emoji}</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Le statut de votre commande <strong>${numeroCommande}</strong> a été mis à jour.</p>
        <div class="info-box">
            <p style="margin: 0; font-size: 18px;"><strong>Statut : ${statusInfo.title}</strong></p>
            <p style="margin: 10px 0 0 0;">${statusInfo.message}</p>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" class="button">Voir ma commande</a>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;
  return sendEmail(email, `Commande ${numeroCommande} - ${statusInfo.title}`, getEmailTemplate(content));
};

// 7. Email de confirmation de rendez-vous
const sendAppointmentConfirmationEmail = async (email, nom, dateHeure, serviceNom) => {
  const date = new Date(dateHeure);
  const dateFormatted = date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeFormatted = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const content = `
        <h2>Rendez-vous confirmé ! 📅</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Votre rendez-vous a été confirmé avec succès.</p>
        <div class="info-box">
            <p style="margin: 0;"><strong>Détails du rendez-vous :</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Service :</strong> ${serviceNom}</li>
                <li><strong>Date :</strong> ${dateFormatted}</li>
                <li><strong>Heure :</strong> ${timeFormatted}</li>
            </ul>
        </div>
        <p><strong>⚠️ Important :</strong> Vous pouvez annuler votre rendez-vous jusqu'à 24h avant la date prévue.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments" class="button">Voir mes rendez-vous</a>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;
  return sendEmail(email, 'Rendez-vous confirmé', getEmailTemplate(content));
};

// 8. Email de newsletter
const sendNewsletterEmail = async (email, sujet, contenu, unsubscribeToken) => {
  const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter/unsubscribe?token=${unsubscribeToken}`;

  const content = `
        ${contenu}
        <div class="divider"></div>
        <p style="font-size: 12px; color: #666;">
            Vous recevez cet email car vous êtes abonné à notre newsletter.<br>
            <a href="${unsubscribeUrl}" style="color: #1e3c72;">Se désabonner</a>
        </p>
    `;
  return sendEmail(email, sujet, getEmailTemplate(content, sujet));
};

// 9. Email de facture (envoyée à la livraison)
const sendInvoiceEmail = async (email, nom, numeroCommande, pdfBuffer) => {
  const content = `
        <h2>Votre facture est disponible ! 🧾</h2>
        <p>Bonjour <span class="highlight">${nom}</span>,</p>
        <p>Votre commande <strong>${numeroCommande}</strong> a été livrée avec succès.</p>
        <p>Vous trouverez votre facture en pièce jointe de cet email.</p>
        <div class="info-box">
            <p style="margin: 0;"><strong>Détails :</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Commande :</strong> ${numeroCommande}</li>
                <li><strong>Statut :</strong> Livrée ✓</li>
                <li><strong>Paiement :</strong> Payé ✓</li>
            </ul>
        </div>
        <p>Merci pour votre confiance !</p>
        <p>Cordialement,<br><strong>L'équipe Cars Vision Auto</strong></p>
    `;

  const htmlContent = getEmailTemplate(content, `Facture ${numeroCommande}`);

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Cars Vision Auto <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Facture - Commande ${numeroCommande}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Facture_${numeroCommande}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Facture envoyée:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Erreur envoi facture:', error);
    throw error;
  }
};

module.exports = {
  getEmailTemplate,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendBackofficeAccountEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendAppointmentConfirmationEmail,
  sendNewsletterEmail,
  sendInvoiceEmail
};
