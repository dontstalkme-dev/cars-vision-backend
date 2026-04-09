const db = require('../models');
const { genererSlugUnique } = require('../utils/slug.utils');

// US-M2-03: Créer un produit (Admin)
const creerProduit = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { nom, description, prix, stock, categorie_id, est_actif } = req.body;

        // Validation
        if (!nom || !prix || stock === undefined || !categorie_id) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Nom, prix, stock et catégorie sont obligatoires'
            });
        }

        // Vérifier que la catégorie existe
        const categorie = await db.Categorie.findByPk(categorie_id);
        if (!categorie) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Catégorie non trouvée'
            });
        }

        // Générer slug unique
        const slug = await genererSlugUnique(nom, db.Produit);

        // Créer le produit (inactif par défaut)
        const nouveauProduit = await db.Produit.create({
            nom,
            slug,
            description,
            prix,
            stock,
            categorie_id,
            est_actif: est_actif !== undefined ? est_actif : false
        }, { transaction });

        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Création produit: ${nom}`,
            type_action: 'produit',
            details: {
                produit_id: nouveauProduit.id,
                nom,
                prix,
                stock
            }
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: 'Produit créé avec succès',
            produit: nouveauProduit
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur création produit:', error);
        res.status(500).json({
            message: 'Erreur lors de la création du produit',
            error: error.message
        });
    }
};

// US-M2-04: Upload photos produit (Admin)
const ajouterImageProduit = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { url, est_principale } = req.body;

        if (!url) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'URL de l\'image requise'
            });
        }

        const produit = await db.Produit.findByPk(id);
        if (!produit) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        // Vérifier le nombre d'images (max 6)
        const nombreImages = await db.ImageProduit.count({
            where: { produit_id: id }
        });

        if (nombreImages >= 6) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Maximum 6 images par produit'
            });
        }

        // Si c'est la première image ou est_principale = true, mettre à jour les autres
        if (est_principale || nombreImages === 0) {
            await db.ImageProduit.update(
                { est_principale: false },
                { where: { produit_id: id }, transaction }
            );
        }

        const nouvelleImage = await db.ImageProduit.create({
            produit_id: id,
            url,
            est_principale: est_principale || nombreImages === 0,
            ordre: nombreImages
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: 'Image ajoutée avec succès',
            image: nouvelleImage
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur ajout image:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'ajout de l\'image'
        });
    }
};

// US-M2-08: Modifier un produit (Admin)
const modifierProduit = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { nom, description, prix, stock, categorie_id, est_actif } = req.body;

        const produit = await db.Produit.findByPk(id);
        if (!produit) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        // Vérifier catégorie si fournie
        if (categorie_id && categorie_id !== produit.categorie_id) {
            const categorie = await db.Categorie.findByPk(categorie_id);
            if (!categorie) {
                await transaction.rollback();
                return res.status(404).json({
                    message: 'Catégorie non trouvée'
                });
            }
        }

        const donneesAMettreAJour = {};

        if (nom && nom !== produit.nom) {
            donneesAMettreAJour.nom = nom;
            donneesAMettreAJour.slug = await genererSlugUnique(nom, db.Produit, id);
        }
        if (description !== undefined) donneesAMettreAJour.description = description;
        if (prix !== undefined) donneesAMettreAJour.prix = prix;
        if (stock !== undefined) donneesAMettreAJour.stock = stock;
        if (categorie_id !== undefined) donneesAMettreAJour.categorie_id = categorie_id;
        if (est_actif !== undefined) donneesAMettreAJour.est_actif = est_actif;

        await produit.update(donneesAMettreAJour, { transaction });

        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Modification produit: ${produit.nom}`,
            type_action: 'produit',
            details: {
                produit_id: produit.id,
                modifications: donneesAMettreAJour
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: 'Produit modifié avec succès',
            produit
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur modification produit:', error);
        res.status(500).json({
            message: 'Erreur lors de la modification du produit'
        });
    }
};

// US-M2-09: Mettre à jour le stock (Admin)
const mettreAJourStock = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Stock invalide (doit être >= 0)'
            });
        }

        const produit = await db.Produit.findByPk(id);
        if (!produit) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        const ancienStock = produit.stock;
        await produit.update({ stock }, { transaction });

        // Alerte si stock < 5
        const alerte = stock < 5 ? {
            type: 'stock_faible',
            message: stock === 0 ? 'Produit épuisé' : 'Stock critique (< 5 unités)'
        } : null;

        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Mise à jour stock: ${produit.nom} (${ancienStock} -> ${stock})`,
            type_action: 'produit',
            details: {
                produit_id: produit.id,
                ancien_stock: ancienStock,
                nouveau_stock: stock,
                alerte
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: 'Stock mis à jour avec succès',
            produit: {
                id: produit.id,
                nom: produit.nom,
                stock: produit.stock
            },
            alerte
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur mise à jour stock:', error);
        res.status(500).json({
            message: 'Erreur lors de la mise à jour du stock'
        });
    }
};

// US-M2-10: Désactiver/Supprimer un produit (Admin)
const desactiverProduit = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        const produit = await db.Produit.findByPk(id);
        if (!produit) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        // Désactivation préférée à la suppression
        await produit.update({ est_actif: false }, { transaction });

        await db.JournalAdmin.create({
            utilisateur_id: req.utilisateur.id,
            action: `Désactivation produit: ${produit.nom}`,
            type_action: 'produit',
            details: {
                produit_id: produit.id,
                nom: produit.nom
            }
        }, { transaction });

        await transaction.commit();

        res.json({
            message: 'Produit désactivé avec succès (retiré du catalogue public)'
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur désactivation produit:', error);
        res.status(500).json({
            message: 'Erreur lors de la désactivation du produit'
        });
    }
};

// Liste tous les produits (Admin - inclut inactifs)
const obtenirTousProduits = async (req, res) => {
    try {
        const { page = 1, limite = 20, est_actif, categorie_id } = req.query;
        const offset = (page - 1) * limite;
        const where = {};

        if (est_actif !== undefined) where.est_actif = est_actif === 'true';
        if (categorie_id) where.categorie_id = categorie_id;

        const { count, rows: produits } = await db.Produit.findAndCountAll({
            where,
            limit: parseInt(limite),
            offset: parseInt(offset),
            order: [['cree_le', 'DESC']],
            include: [
                {
                    model: db.Categorie,
                    as: 'categorie',
                    attributes: ['id', 'nom']
                },
                {
                    model: db.ImageProduit,
                    as: 'images',
                    where: { est_principale: true },
                    required: false,
                    limit: 1
                }
            ]
        });

        res.json({
            produits,
            pagination: {
                total: count,
                page: parseInt(page),
                limite: parseInt(limite),
                total_pages: Math.ceil(count / limite)
            }
        });

    } catch (error) {
        console.error('Erreur obtenir tous produits:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des produits'
        });
    }
};

// Upload image produit (fichier)
const uploadImageProduit = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        const produit = await db.Produit.findByPk(id);
        if (!produit) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Produit non trouvé'
            });
        }

        if (!req.file) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Aucun fichier fourni'
            });
        }

        // Vérifier le nombre d'images existantes
        const nombreImages = await db.ImageProduit.count({
            where: { produit_id: id }
        });

        if (nombreImages >= 6) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Maximum 6 images par produit'
            });
        }

        const url = `/uploads/products/${req.file.filename}`;
        const est_principale = req.body.est_principale === 'true' || nombreImages === 0;

        // Si est_principale = true, mettre les autres à false
        if (est_principale) {
            await db.ImageProduit.update(
                { est_principale: false },
                { where: { produit_id: id }, transaction }
            );
        }

        const image = await db.ImageProduit.create({
            produit_id: id,
            url,
            est_principale,
            ordre: nombreImages
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: 'Image uploadée avec succès',
            image
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erreur upload image:', error);
        res.status(500).json({
            message: 'Erreur lors de l\'upload de l\'image',
            error: error.message
        });
    }
};

// Obtenir produits avec stock faible
const obtenirProduitsStockFaible = async (req, res) => {
    try {
        const { seuil = 10 } = req.query;

        const produits = await db.Produit.findAll({
            where: {
                stock: {
                    [db.Sequelize.Op.lte]: parseInt(seuil)
                },
                actif: true
            },
            include: [
                {
                    model: db.Categorie,
                    as: 'categorie',
                    attributes: ['id', 'nom']
                },
                {
                    model: db.ImageProduit,
                    as: 'images',
                    where: { est_principale: true },
                    required: false
                }
            ],
            order: [['stock', 'ASC']]
        });

        res.json({
            produits,
            total: produits.length,
            seuil: parseInt(seuil),
            message: produits.length > 0 ? `${produits.length} produit(s) avec stock faible` : 'Aucun produit avec stock faible'
        });

    } catch (error) {
        console.error('Erreur stock faible:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des produits'
        });
    }
};

module.exports = {
    creerProduit,
    ajouterImageProduit,
    uploadImageProduit,
    modifierProduit,
    mettreAJourStock,
    desactiverProduit,
    obtenirTousProduits,
    obtenirProduitsStockFaible
};
