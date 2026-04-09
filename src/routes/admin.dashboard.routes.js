const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/admin.dashboard.controller');
const adminCommandeController = require('../controllers/admin.commande.controller');
const adminRendezvousController = require('../controllers/admin.rendezvous.controller');
const adminParametresController = require('../controllers/admin.parametres.controller');
const adminJournalController = require('../controllers/admin.journal.controller');
const { verifierAdmin } = require('../middleware/auth.middleware');

// Dashboard
router.get('/dashboard', verifierAdmin, adminDashboardController.getDashboard);
router.get('/statistiques', verifierAdmin, adminDashboardController.getStatistiques);
router.get('/dashboard/revenue-history', verifierAdmin, adminDashboardController.getRevenueHistory);

// Commandes
router.get('/commandes', verifierAdmin, adminCommandeController.listerCommandes);
router.get('/commandes/:commande_id', verifierAdmin, adminCommandeController.detailsCommande);
router.put('/commandes/:commande_id/statut', verifierAdmin, adminCommandeController.modifierStatutCommande);
router.put('/commandes/:commande_id/paiement', verifierAdmin, adminCommandeController.modifierStatutPaiement);

// Rendez-vous
router.get('/rendezvous', verifierAdmin, adminRendezvousController.listerRendezVous);
router.get('/rendezvous/:rendezvous_id', verifierAdmin, adminRendezvousController.detailsRendezVous);
router.put('/rendezvous/:rendezvous_id/confirmer', verifierAdmin, adminRendezvousController.confirmerRendezVous);
router.put('/rendezvous/:rendezvous_id/completer', verifierAdmin, adminRendezvousController.completerRendezVous);
router.put('/rendezvous/:rendezvous_id/notes', verifierAdmin, adminRendezvousController.ajouterNotes);

// Paramètres
router.get('/parametres', verifierAdmin, adminParametresController.listerParametres);
router.get('/parametres/:cle', verifierAdmin, adminParametresController.voirParametre);
router.put('/parametres/:cle', verifierAdmin, adminParametresController.modifierParametre);
router.post('/parametres', verifierAdmin, adminParametresController.creerParametre);
router.delete('/parametres/:cle', verifierAdmin, adminParametresController.supprimerParametre);

// Journal d'audit
router.get('/journal', verifierAdmin, adminJournalController.listerJournal);
router.get('/journal/:action_id', verifierAdmin, adminJournalController.detailsAction);
router.get('/journal/stats', verifierAdmin, adminJournalController.statistiquesJournal);

module.exports = router;
