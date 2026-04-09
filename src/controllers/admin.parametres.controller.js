const { Parametres } = require('../models');

// Lister tous les paramètres
exports.listerParametres = async (req, res) => {
    try {
        const parametres = await Parametres.findAll({
            order: [['cle', 'ASC']]
        });

        res.status(200).json({
            message: 'Liste des paramètres',
            data: parametres
        });
    } catch (error) {
        console.error('Erreur liste paramètres:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Voir un paramètre
exports.voirParametre = async (req, res) => {
    try {
        const { cle } = req.params;

        const parametre = await Parametres.findOne({ where: { cle } });
        if (!parametre) {
            return res.status(404).json({ message: 'Paramètre non trouvé' });
        }

        res.status(200).json({
            message: 'Paramètre',
            data: parametre
        });
    } catch (error) {
        console.error('Erreur voir paramètre:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Modifier un paramètre
exports.modifierParametre = async (req, res) => {
    try {
        const { cle } = req.params;
        const { valeur, description } = req.body;

        if (!valeur) {
            return res.status(400).json({ message: 'Valeur requise' });
        }

        const parametre = await Parametres.findOne({ where: { cle } });
        if (!parametre) {
            return res.status(404).json({ message: 'Paramètre non trouvé' });
        }

        const updates = { valeur };
        if (description) updates.description = description;

        await parametre.update(updates);

        res.status(200).json({
            message: 'Paramètre modifié',
            data: parametre
        });
    } catch (error) {
        console.error('Erreur modification paramètre:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Créer un nouveau paramètre
exports.creerParametre = async (req, res) => {
    try {
        const { cle, valeur, description, type } = req.body;

        if (!cle || !valeur) {
            return res.status(400).json({ message: 'Clé et valeur requises' });
        }

        // Vérifier si la clé existe déjà
        const existant = await Parametres.findOne({ where: { cle } });
        if (existant) {
            return res.status(400).json({ message: 'Cette clé existe déjà' });
        }

        const parametre = await Parametres.create({
            cle,
            valeur,
            description: description || '',
            type: type || 'string'
        });

        res.status(201).json({
            message: 'Paramètre créé',
            data: parametre
        });
    } catch (error) {
        console.error('Erreur création paramètre:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Supprimer un paramètre
exports.supprimerParametre = async (req, res) => {
    try {
        const { cle } = req.params;

        const parametre = await Parametres.findOne({ where: { cle } });
        if (!parametre) {
            return res.status(404).json({ message: 'Paramètre non trouvé' });
        }

        await parametre.destroy();

        res.status(200).json({
            message: 'Paramètre supprimé'
        });
    } catch (error) {
        console.error('Erreur suppression paramètre:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
