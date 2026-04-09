const { Service } = require('../models');
const logger = require('../utils/logger');

// Lister les services actifs (public)
exports.listerServicesActifs = async (req, res) => {
    try {
        const services = await Service.findAll({
            where: { est_actif: true },
            order: [['ordre', 'ASC'], ['nom', 'ASC']],
            attributes: ['id', 'nom', 'slug', 'description', 'image']
        });

        res.json({
            message: 'Services disponibles',
            total: services.length,
            services
        });
    } catch (error) {
        logger.error('Erreur liste services actifs:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des services',
            error: error.message
        });
    }
};

// Obtenir un service par slug (public)
exports.obtenirService = async (req, res) => {
    try {
        const { slug } = req.params;

        const service = await db.Service.findOne({
            where: { slug, est_actif: true },
            attributes: ['id', 'nom', 'slug', 'description', 'prix', 'duree_minutes']
        });

        if (!service) {
            return res.status(404).json({
                message: 'Service non trouvé'
            });
        }

        res.json({
            message: 'Détails du service',
            service
        });
    } catch (error) {
        logger.error('Erreur obtenir service:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération du service',
            error: error.message
        });
    }
};
