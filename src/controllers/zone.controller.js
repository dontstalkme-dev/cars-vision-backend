const { ZoneLivraison } = require('../models');
const logger = require('../utils/logger');

// Lister les zones actives (public)
exports.listerZonesActives = async (req, res) => {
    try {
        const zones = await ZoneLivraison.findAll({
            where: { est_actif: true },
            order: [['ordre', 'ASC'], ['nom', 'ASC']],
            attributes: ['id', 'nom', 'description', 'frais_livraison', 'delai_livraison_jours']
        });

        res.json({
            message: 'Zones de livraison disponibles',
            total: zones.length,
            zones
        });
    } catch (error) {
        logger.error('Erreur liste zones actives:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des zones',
            error: error.message
        });
    }
};
