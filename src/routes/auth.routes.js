const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// US-M1-01: Inscription
router.post('/register', authController.inscription);

// US-M1-02: Connexion
router.post('/login', authController.connexion);

// US-M1-03: Rafraîchir token
router.post('/refresh', authController.rafraichirToken);

// US-M1-04: Déconnexion
router.post('/logout', authController.deconnexion);

// US-M1-05: Demander reset mot de passe
router.post('/forgot-password', authController.demanderResetMotDePasse);

// US-M1-06: Réinitialiser mot de passe
router.post('/reset-password', authController.reinitialiserMotDePasse);

module.exports = router;
