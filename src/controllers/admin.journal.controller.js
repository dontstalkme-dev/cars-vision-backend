const { JournalAdmin, Utilisateur } = require('../models');
const { Op } = require('sequelize');

// Lister les actions du journal
exports.listerJournal = async (req, res) => {
    try {
        const { type_action, utilisateur_id, date_debut, date_fin, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (type_action) where.type_action = type_action;
        if (utilisateur_id) where.utilisateur_id = utilisateur_id;
        if (date_debut || date_fin) {
            where.cree_le = {};
            if (date_debut) where.cree_le[Op.gte] = new Date(date_debut);
            if (date_fin) where.cree_le[Op.lte] = new Date(date_fin);
        }

        const { count, rows } = await JournalAdmin.findAndCountAll({
            where,
            include: [
                { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'email'] }
            ],
            order: [['cree_le', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            message: 'Journal des actions',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            },
            data: rows
        });
    } catch (error) {
        console.error('Erreur liste journal:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Voir détails d'une action
exports.detailsAction = async (req, res) => {
    try {
        const { action_id } = req.params;

        const action = await JournalAdmin.findByPk(action_id, {
            include: [
                { model: Utilisateur, as: 'utilisateur', attributes: ['id', 'nom', 'email'] }
            ]
        });

        if (!action) {
            return res.status(404).json({ message: 'Action non trouvée' });
        }

        res.status(200).json({
            message: 'Détails action',
            data: action
        });
    } catch (error) {
        console.error('Erreur détails action:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Enregistrer une action (utilisé en interne)
exports.enregistrerAction = async (utilisateur_id, type_action, description, entite_id = null, entite_type = null) => {
    try {
        await JournalAdmin.create({
            utilisateur_id,
            type_action,
            description,
            entite_id,
            entite_type
        });
    } catch (error) {
        console.error('Erreur enregistrement action:', error);
    }
};

// Statistiques du journal
exports.statistiquesJournal = async (req, res) => {
    try {
        const { date_debut, date_fin } = req.query;

        const where = {};
        if (date_debut || date_fin) {
            where.cree_le = {};
            if (date_debut) where.cree_le[Op.gte] = new Date(date_debut);
            if (date_fin) where.cree_le[Op.lte] = new Date(date_fin);
        }

        // Actions par type
        const actionParType = await JournalAdmin.findAll({
            attributes: [
                'type_action',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            where,
            group: ['type_action'],
            raw: true
        });

        // Actions par utilisateur
        const actionParUtilisateur = await JournalAdmin.findAll({
            attributes: [
                'utilisateur_id',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            where,
            include: [
                { model: Utilisateur, as: 'utilisateur', attributes: ['nom', 'email'] }
            ],
            group: ['utilisateur_id'],
            raw: true,
            limit: 10
        });

        res.status(200).json({
            message: 'Statistiques journal',
            data: {
                actions_par_type: actionParType,
                actions_par_utilisateur: actionParUtilisateur
            }
        });
    } catch (error) {
        console.error('Erreur statistiques journal:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
