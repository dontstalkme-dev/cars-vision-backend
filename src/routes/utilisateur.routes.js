const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur.controller');
const { verifierAuthentification } = require('../middleware/auth.middleware');

// US-M1-09: Consulter mon profil
router.get('/me', verifierAuthentification, utilisateurController.obtenirMonProfil);

// US-M1-10: Modifier mes informations
router.put('/me', verifierAuthentification, utilisateurController.modifierMonProfil);

// US-M1-11: Changer mon mot de passe
router.put('/me/password', verifierAuthentification, utilisateurController.changerMotDePasse);

module.exports = router;
