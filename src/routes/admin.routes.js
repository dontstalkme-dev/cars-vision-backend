const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

// Toutes les routes admin nécessitent authentification + role admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser); // Admin crée un utilisateur backoffice
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole); // Changer le role

module.exports = router;
