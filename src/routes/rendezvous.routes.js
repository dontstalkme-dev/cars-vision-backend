const express = require('express');
const router = express.Router();
const rendezvousController = require('../controllers/rendezvous.controller');
const { verifierAuthentification, verifierAdmin, verifierAuthOptionnel } = require('../middleware/auth.middleware');

// US-M4-04: Voir créneaux disponibles (Public - pas d'auth requise)
router.get('/slots', rendezvousController.obtenirCreneauxDisponibles);

// US-M4-05: Réserver un rendez-vous (Public avec auth optionnelle - guests can book too)
router.post('/', verifierAuthOptionnel, rendezvousController.reserverRendezVous);

// US-M4-06: Consulter mes rendez-vous (Client)
router.get('/my', verifierAuthentification, rendezvousController.mesRendezVous);

// US-M4-07: Annuler un rendez-vous (Client)
router.put('/:id/cancel', verifierAuthentification, rendezvousController.annulerRendezVous);

// Routes admin
router.use(verifierAdmin);

// US-M4-08: Voir tous les RDV (Admin)
router.get('/', rendezvousController.tousLesRendezVous);

// US-M4-09: Confirmer/Clôturer un RDV (Admin)
router.put('/:id', rendezvousController.modifierRendezVous);

// Supprimer un RDV (Admin)
router.delete('/:id', rendezvousController.supprimerRendezVous);

module.exports = router;
