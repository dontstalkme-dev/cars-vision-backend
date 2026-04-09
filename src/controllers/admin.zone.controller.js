const db = require('../models');

// Créer une zone de livraison
exports.creerZone = async (req, res) => {
    try {
        const { nom, description, frais_livraison, delai_livraison_jours } = req.body;

        if (!nom || frais_livraison === undefined) {
            return res.status(400).json({
                message: 'Nom et frais de livraison sont requis'
            });
        }

        const zone = await db.ZoneLivraison.create({
            nom,
            description,
            frais_livraison,
            delai_livraison_jours: delai_livraison_jours || 3,
            est_actif: true
        });

        res.status(201).json({
            message: 'Zone de livraison créée avec succès',
            zone
        });
    } catch (error) {
        console.error('Erreur création zone:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de la zone',
            error: error.message
        });
    }
};

// Lister toutes les zones (admin)
exports.listerToutesZones = async (req, res) => {
    try {
        const zones = await db.ZoneLivraison.findAll({
            order: [['ordre', 'ASC'], ['nom', 'ASC']]
        });

        res.json({
            message: 'Liste des zones de livraison',
            total: zones.length,
            zones
        });
    } catch (error) {
        console.error('Erreur liste zones:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des zones',
            error: error.message
        });
    }
};

// Modifier une zone
exports.modifierZone = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, frais_livraison, delai_livraison_jours, est_actif, ordre } = req.body;

        const zone = await db.ZoneLivraison.findByPk(id);

        if (!zone) {
            return res.status(404).json({
                message: 'Zone non trouvée'
            });
        }

        await zone.update({
            nom: nom || zone.nom,
            description: description !== undefined ? description : zone.description,
            frais_livraison: frais_livraison !== undefined ? frais_livraison : zone.frais_livraison,
            delai_livraison_jours: delai_livraison_jours || zone.delai_livraison_jours,
            est_actif: est_actif !== undefined ? est_actif : zone.est_actif,
            ordre: ordre !== undefined ? ordre : zone.ordre,
            modifie_le: new Date()
        });

        res.json({
            message: 'Zone modifiée avec succès',
            zone
        });
    } catch (error) {
        console.error('Erreur modification zone:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification de la zone',
            error: error.message
        });
    }
};

// Supprimer une zone
exports.supprimerZone = async (req, res) => {
    try {
        const { id } = req.params;

        const zone = await db.ZoneLivraison.findByPk(id);

        if (!zone) {
            return res.status(404).json({
                message: 'Zone non trouvée'
            });
        }

        // Vérifier s'il y a des commandes associées
        const commandesCount = await db.Commande.count({
            where: { zone_livraison_id: id }
        });

        if (commandesCount > 0) {
            return res.status(400).json({
                message: 'Impossible de supprimer cette zone car elle a des commandes associées',
                commandes_count: commandesCount
            });
        }

        await zone.destroy();

        res.json({
            message: 'Zone supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression zone:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression de la zone',
            error: error.message
        });
    }
};
