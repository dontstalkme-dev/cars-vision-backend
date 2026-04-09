const db = require('../models');
const { genererSlugUnique } = require('../utils/slug.utils');

// US-M2-01: Créer une catégorie (Admin)
const creerCategorie = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { nom, description, image, parent_id } = req.body;

        if (!nom) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Le nom de la catégorie est obligatoire'
            });
        }

        // Vérifier si le parent existe
        if (parent_id) {
            const parent = await db.Categorie.findByPk(parent_id);
            if (!parent) {
                await transaction.rollback();
                return res.status(404).json({
                    message: 'Catégorie parente non trouvée'
                });
            }
        }

        // Générer slug unique
        const slug = await genererSlugUnique(nom, db.Categorie);

        // Créer la catégorie
        const nouvelleCategorie = await db.Categorie.create({
            nom,
            slug,
            description,
            image,
            parent_id,
            est_actif: true
        }, { transaction });

        // Logger l'action
        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Création catégorie: ${nom}`,
            type_action: 'produit',
            details: {
                categorie_id: nouvelleCategorie.id,
                nom,
                slug
            }
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: 'Catégorie créée avec succès',
            categorie: nouvelleCategorie
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur création catégorie:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de la catégorie',
            error: error.message
        });
    }
};

// Modifier une catégorie (Admin)
const modifierCategorie = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { nom, description, image, parent_id, est_actif } = req.body;

        const categorie = await db.Categorie.findByPk(id);

        if (!categorie) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Catégorie non trouvée'
            });
        }

        // Vérifier parent_id si fourni
        if (parent_id && parent_id !== categorie.parent_id) {
            if (parent_id === id) {
                await transaction.rollback();
                return res.status(400).json({
                    message: 'Une catégorie ne peut pas être son propre parent'
                });
            }

            const parent = await db.Categorie.findByPk(parent_id);
            if (!parent) {
                await transaction.rollback();
                return res.status(404).json({
                    message: 'Catégorie parente non trouvée'
                });
            }
        }

        const donneesAMettreAJour = {};

        if (nom && nom !== categorie.nom) {
            donneesAMettreAJour.nom = nom;
            donneesAMettreAJour.slug = await genererSlugUnique(nom, db.Categorie, id);
        }
        if (description !== undefined) donneesAMettreAJour.description = description;
        if (image !== undefined) donneesAMettreAJour.image = image;
        if (parent_id !== undefined) donneesAMettreAJour.parent_id = parent_id;
        if (est_actif !== undefined) donneesAMettreAJour.est_actif = est_actif;

        await categorie.update(donneesAMettreAJour, { transaction });

        // Logger l'action
        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Modification catégorie: ${categorie.nom}`,
            type_action: 'produit',
            details: {
                categorie_id: categorie.id,
                modifications: donneesAMettreAJour
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: 'Catégorie modifiée avec succès',
            categorie
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur modification catégorie:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification de la catégorie'
        });
    }
};

// Supprimer une catégorie (Admin)
const supprimerCategorie = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        const categorie = await db.Categorie.findByPk(id);

        if (!categorie) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Catégorie non trouvée'
            });
        }

        // Vérifier s'il y a des produits
        const nombreProduits = await db.Produit.count({
            where: { categorie_id: id }
        });

        if (nombreProduits > 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: `Impossible de supprimer: ${nombreProduits} produit(s) associé(s). Désactivez plutôt la catégorie.`
            });
        }

        // Vérifier s'il y a des sous-catégories
        const nombreSousCategories = await db.Categorie.count({
            where: { parent_id: id }
        });

        if (nombreSousCategories > 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: `Impossible de supprimer: ${nombreSousCategories} sous-catégorie(s) associée(s)`
            });
        }

        await categorie.destroy({ transaction });

        // Logger l'action
        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Suppression catégorie: ${categorie.nom}`,
            type_action: 'produit',
            details: {
                categorie_id: id,
                nom: categorie.nom
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: 'Catégorie supprimée avec succès'
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur suppression catégorie:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression de la catégorie'
        });
    }
};

module.exports = {
    creerCategorie,
    modifierCategorie,
    supprimerCategorie
};
