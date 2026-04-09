const db = require('../models');
const { genererSlug } = require('../utils/slug.utils');

// Créer un service
exports.creerService = async (req, res) => {
    try {
        const { nom, description, image } = req.body;

        if (!nom) {
            return res.status(400).json({
                message: 'Le nom du service est requis'
            });
        }

        const slug = await genererSlug(nom, db.Service);

        const service = await db.Service.create({
            nom,
            slug,
            description,
            prix: 0,
            duree_minutes: 0,
            image: image || null,
            est_actif: true
        });

        res.status(201).json({
            message: 'Service créé avec succès',
            service
        });
    } catch (error) {
        console.error('Erreur création service:', error);
        res.status(500).json({
            message: 'Erreur lors de la création du service',
            error: error.message
        });
    }
};

// Lister tous les services (admin)
exports.listerTousServices = async (req, res) => {
    try {
        const services = await db.Service.findAll({
            order: [['ordre', 'ASC'], ['nom', 'ASC']]
        });

        res.json({
            message: 'Liste des services',
            total: services.length,
            services
        });
    } catch (error) {
        console.error('Erreur liste services:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des services',
            error: error.message
        });
    }
};

// Modifier un service
exports.modifierService = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, est_actif, ordre, image } = req.body;

        const service = await db.Service.findByPk(id);

        if (!service) {
            return res.status(404).json({
                message: 'Service non trouvé'
            });
        }

        // Générer nouveau slug si nom change
        let slug = service.slug;
        if (nom && nom !== service.nom) {
            slug = await genererSlug(nom, db.Service, id);
        }

        await service.update({
            nom: nom || service.nom,
            slug,
            description: description !== undefined ? description : service.description,
            image: image !== undefined ? image : service.image,
            est_actif: est_actif !== undefined ? est_actif : service.est_actif,
            ordre: ordre !== undefined ? ordre : service.ordre,
            modifie_le: new Date()
        });

        res.json({
            message: 'Service modifié avec succès',
            service
        });
    } catch (error) {
        console.error('Erreur modification service:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification du service',
            error: error.message
        });
    }
};

// Supprimer un service
exports.supprimerService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await db.Service.findByPk(id);

        if (!service) {
            return res.status(404).json({
                message: 'Service non trouvé'
            });
        }

        // Vérifier s'il y a des RDV associés
        const rdvCount = await db.RendezVous.count({
            where: { service_id: id }
        });

        if (rdvCount > 0) {
            return res.status(400).json({
                message: 'Impossible de supprimer ce service car il a des rendez-vous associés',
                rdv_count: rdvCount
            });
        }

        await service.destroy();

        res.json({
            message: 'Service supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression service:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression du service',
            error: error.message
        });
    }
};

// Upload image service
exports.uploadImageService = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await db.Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier fourni' });
        }

        const url = `/uploads/services/${req.file.filename}`;
        await service.update({ image: url, modifie_le: new Date() });

        res.json({
            message: 'Image du service uploadée avec succès',
            service
        });
    } catch (error) {
        console.error('Erreur upload image service:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'upload de l\'image',
            error: error.message
        });
    }
};
