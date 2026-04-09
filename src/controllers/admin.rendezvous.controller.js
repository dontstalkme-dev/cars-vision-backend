const { RendezVous, Utilisateur } = require('../models');
const { sendAppointmentConfirmationEmail } = require('../utils/email.utils');
const { Op } = require('sequelize');

// Lister tous les rendez-vous
exports.listerRendezVous = async (req, res) => {
    try {
        const { statut, date, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (statut) where.statut = statut;
        if (date) {
            const debut = new Date(date);
            const fin = new Date(debut.getTime() + 24 * 60 * 60 * 1000);
            where.date_heure = { [Op.between]: [debut, fin] };
        }

        const { count, rows } = await RendezVous.findAndCountAll({
            where,
            include: [
                { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'email', 'telephone'] }
            ],
            order: [['date_heure', 'ASC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            message: 'Liste des rendez-vous',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        console.error('Erreur liste rendez-vous:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Voir détails d'un rendez-vous
exports.detailsRendezVous = async (req, res) => {
    try {
        const { rendezvous_id } = req.params;

        const rendezvous = await RendezVous.findByPk(rendezvous_id, {
            include: [
                { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'email', 'telephone'] }
            ]
        });

        if (!rendezvous) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        res.status(200).json({
            message: 'Détails rendez-vous',
            data: rendezvous
        });
    } catch (error) {
        console.error('Erreur détails rendez-vous:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Confirmer un rendez-vous
exports.confirmerRendezVous = async (req, res) => {
    try {
        const { rendezvous_id } = req.params;

        const rendezvous = await RendezVous.findByPk(rendezvous_id, {
            include: [{ model: Utilisateur, as: 'utilisateur' }]
        });

        if (!rendezvous) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        if (rendezvous.statut !== 'EN_ATTENTE') {
            return res.status(400).json({ message: 'Seuls les rendez-vous en attente peuvent être confirmés' });
        }

        await rendezvous.update({ statut: 'CONFIRME' });

        // Envoyer email
        if (rendezvous.utilisateur) {
            await sendAppointmentConfirmationEmail(
                rendezvous.utilisateur.email,
                `${rendezvous.utilisateur.prenom} ${rendezvous.utilisateur.nom}`,
                rendezvous.date_heure,
                rendezvous.service_nom
            );
        }

        res.status(200).json({
            message: 'Rendez-vous confirmé',
            data: rendezvous
        });
    } catch (error) {
        console.error('Erreur confirmation rendez-vous:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Compléter un rendez-vous
exports.completerRendezVous = async (req, res) => {
    try {
        const { rendezvous_id } = req.params;
        const { notes_mecanicien } = req.body;

        const rendezvous = await RendezVous.findByPk(rendezvous_id, {
            include: [{ model: Utilisateur, as: 'utilisateur' }]
        });

        if (!rendezvous) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        if (rendezvous.statut === 'ANNULE') {
            return res.status(400).json({ message: 'Un rendez-vous annulé ne peut pas être complété' });
        }

        await rendezvous.update({
            statut: 'TERMINE',
            notes_mecanicien: notes_mecanicien || rendezvous.notes_mecanicien
        });

        res.status(200).json({
            message: 'Rendez-vous complété',
            data: rendezvous
        });
    } catch (error) {
        console.error('Erreur complétion rendez-vous:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Ajouter/modifier notes mécanicien
exports.ajouterNotes = async (req, res) => {
    try {
        const { rendezvous_id } = req.params;
        const { notes_mecanicien } = req.body;

        if (!notes_mecanicien) {
            return res.status(400).json({ message: 'Notes requises' });
        }

        const rendezvous = await RendezVous.findByPk(rendezvous_id);
        if (!rendezvous) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }

        await rendezvous.update({ notes_mecanicien });

        res.status(200).json({
            message: 'Notes ajoutées',
            data: rendezvous
        });
    } catch (error) {
        console.error('Erreur ajout notes:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
