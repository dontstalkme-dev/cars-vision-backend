const { body, param, query, validationResult } = require('express-validator');

/**
 * PHASE 2.3 : Middleware de validation avec express-validator
 * Centralise toutes les validations pour éviter la duplication
 */

// Gestionnaire d'erreurs de validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Erreurs de validation',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Validations pour l'authentification
const validateRegister = [
    body('email')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    body('mot_de_passe')
        .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    body('prenom')
        .trim()
        .notEmpty().withMessage('Le prénom est requis')
        .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
    body('nom')
        .trim()
        .notEmpty().withMessage('Le nom est requis')
        .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    body('telephone')
        .trim()
        .notEmpty().withMessage('Le téléphone est requis')
        .matches(/^(\+237)?[0-9]{9}$/).withMessage('Numéro de téléphone invalide (format: +237XXXXXXXXX ou XXXXXXXXX)'),
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    body('mot_de_passe')
        .notEmpty().withMessage('Le mot de passe est requis'),
    handleValidationErrors
];

const validateForgotPassword = [
    body('email')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    handleValidationErrors
];

const validateResetPassword = [
    body('token')
        .notEmpty().withMessage('Token requis'),
    body('nouveau_mot_de_passe')
        .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
    handleValidationErrors
];

// Validations pour les commandes
const validateCreateOrder = [
    body('adresse_livraison')
        .trim()
        .notEmpty().withMessage('L\'adresse de livraison est requise')
        .isLength({ min: 10, max: 500 }).withMessage('L\'adresse doit contenir entre 10 et 500 caractères'),
    body('telephone_livraison')
        .trim()
        .notEmpty().withMessage('Le téléphone de livraison est requis')
        .matches(/^(\+237)?[0-9]{9}$/).withMessage('Numéro de téléphone invalide'),
    body('zone_livraison_id')
        .isUUID().withMessage('ID de zone de livraison invalide'),
    handleValidationErrors
];

const validateCreateGuestOrder = [
    body('nom_invite')
        .trim()
        .notEmpty().withMessage('Le nom est requis')
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
    body('email_invite')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    body('telephone_invite')
        .trim()
        .notEmpty().withMessage('Le téléphone est requis')
        .matches(/^(\+237)?[0-9]{9}$/).withMessage('Numéro de téléphone invalide'),
    body('adresse_livraison')
        .trim()
        .notEmpty().withMessage('L\'adresse de livraison est requise')
        .isLength({ min: 10, max: 500 }).withMessage('L\'adresse doit contenir entre 10 et 500 caractères'),
    body('telephone_livraison')
        .trim()
        .notEmpty().withMessage('Le téléphone de livraison est requis')
        .matches(/^(\+237)?[0-9]{9}$/).withMessage('Numéro de téléphone invalide'),
    body('zone_livraison_id')
        .isUUID().withMessage('ID de zone de livraison invalide'),
    handleValidationErrors
];

// Validations pour le panier
const validateAddToCart = [
    body('produit_id')
        .isUUID().withMessage('ID de produit invalide'),
    body('quantite')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('La quantité doit être entre 1 et 100'),
    handleValidationErrors
];

const validateUpdateCartQuantity = [
    param('itemId')
        .isUUID().withMessage('ID d\'article invalide'),
    body('quantite')
        .isInt({ min: 1, max: 100 }).withMessage('La quantité doit être entre 1 et 100'),
    handleValidationErrors
];

// Validations pour les rendez-vous
const validateCreateAppointment = [
    body('service_id')
        .isUUID().withMessage('ID de service invalide'),
    body('date_rdv')
        .isDate().withMessage('Date invalide (format: YYYY-MM-DD)'),
    body('heure_debut')
        .matches(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure invalide (format: HH:MM)'),
    body('marque_vehicule')
        .trim()
        .notEmpty().withMessage('La marque du véhicule est requise')
        .isLength({ min: 2, max: 50 }).withMessage('La marque doit contenir entre 2 et 50 caractères'),
    body('modele_vehicule')
        .trim()
        .notEmpty().withMessage('Le modèle du véhicule est requis')
        .isLength({ min: 2, max: 50 }).withMessage('Le modèle doit contenir entre 2 et 50 caractères'),
    body('annee_vehicule')
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année du véhicule invalide'),
    body('site')
        .optional()
        .isIn(['bonamoussadi', 'ndokoti']).withMessage('Site invalide (bonamoussadi ou ndokoti)'),
    handleValidationErrors
];

// Validations pour les avis
const validateCreateReview = [
    body('produit_id')
        .isUUID().withMessage('ID de produit invalide'),
    body('note')
        .isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
    body('commentaire')
        .trim()
        .notEmpty().withMessage('Le commentaire est requis')
        .isLength({ min: 10, max: 1000 }).withMessage('Le commentaire doit contenir entre 10 et 1000 caractères'),
    handleValidationErrors
];

// Validations pour la newsletter
const validateNewsletterSubscribe = [
    body('email')
        .isEmail().withMessage('Email invalide')
        .normalizeEmail(),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateCreateOrder,
    validateCreateGuestOrder,
    validateAddToCart,
    validateUpdateCartQuantity,
    validateCreateAppointment,
    validateCreateReview,
    validateNewsletterSubscribe
};
