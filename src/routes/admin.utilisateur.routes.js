const express = require('express');
const router = express.Router();
const adminUtilisateurController = require('../controllers/admin.utilisateur.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent le rôle admin
router.use(verifierAdmin);

// US-M1-12: Liste des utilisateurs
router.get('/', adminUtilisateurController.obtenirListeUtilisateurs);

// US-M1-13: Bloquer/Débloquer utilisateur
router.put('/:id/status', adminUtilisateurController.modifierStatutUtilisateur);

// Créer un utilisateur backoffice (admin peut choisir le rôle)
router.post('/', adminUtilisateurController.creerUtilisateur);

// Modifier un utilisateur (general update)
router.put('/:id', adminUtilisateurController.modifierUtilisateur);

// Modifier le rôle d'un utilisateur
router.put('/:id/role', adminUtilisateurController.modifierRoleUtilisateur);

module.exports = router;
