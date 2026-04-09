const jwt = require('jsonwebtoken');
const db = require('../models');

// Vérifier l'authentification (JWT valide)
const verifierAuthentification = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Token d\'authentification manquant'
            });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        const utilisateur = await db.Utilisateur.findByPk(decoded.id);

        if (!utilisateur) {
            return res.status(401).json({
                message: 'Utilisateur non trouvé'
            });
        }

        if (utilisateur.statut === 'bloque') {
            return res.status(403).json({
                message: 'Votre compte a été bloqué'
            });
        }

        req.utilisateur = utilisateur;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expiré',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            message: 'Token invalide'
        });
    }
};

// Vérifier que l'utilisateur est admin
// Utilise un tableau de middlewares pour éviter la double réponse HTTP
const verifierAdmin = [
    verifierAuthentification,
    (req, res, next) => {
        if (!req.utilisateur || req.utilisateur.role !== 'admin') {
            return res.status(403).json({
                message: 'Accès réservé aux administrateurs'
            });
        }
        next();
    }
];

// Vérifier guest_token pour panier invité
const verifierGuestToken = (req, res, next) => {
    const guestToken = req.headers['x-guest-token'];

    if (!guestToken) {
        return res.status(400).json({
            message: 'Token invité manquant'
        });
    }

    req.guestToken = guestToken;
    next();
};

// Accepter JWT OU guest_token
const verifierAuthOuGuest = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const guestToken = req.headers['x-guest-token'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Utilisateur connecté
        return verifierAuthentification(req, res, next);
    } else if (guestToken) {
        // Invité
        req.guestToken = guestToken;
        req.estInvite = true;
        return next();
    } else {
        return res.status(401).json({
            message: 'Authentification ou token invité requis'
        });
    }
};

// Auth optionnelle : si token présent et valide, on attache l'utilisateur, sinon on continue
const verifierAuthOptionnel = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const utilisateur = await db.Utilisateur.findByPk(decoded.id);
            if (utilisateur && utilisateur.statut !== 'bloque') {
                req.utilisateur = utilisateur;
            }
        }
    } catch (error) {
        // Ignorer les erreurs de token — l'utilisateur reste non connecté
    }
    next();
};

module.exports = {
    verifierAuthentification,
    verifierAdmin,
    verifierGuestToken,
    verifierAuthOuGuest,
    verifierAuthOptionnel
};
