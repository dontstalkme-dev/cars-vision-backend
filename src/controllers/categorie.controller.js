const db = require('../models');
const { genererSlugUnique } = require('../utils/slug.utils');

// US-M2-02: Voir toutes les catégories (Public)
const obtenirCategories = async (req, res) => {
    try {
        const categories = await db.Categorie.findAll({
            where: { est_actif: true },
            include: [
                {
                    model: db.Categorie,
                    as: 'sous_categories',
                    where: { est_actif: true },
                    required: false,
                    include: [
                        {
                            model: db.Produit,
                            as: 'produits',
                            where: { est_actif: true },
                            required: false,
                            attributes: []
                        }
                    ]
                },
                {
                    model: db.Produit,
                    as: 'produits',
                    where: { est_actif: true },
                    required: false,
                    attributes: []
                }
            ],
            attributes: {
                include: [
                    [
                        db.sequelize.literal(`(
              SELECT COUNT(*)
              FROM produits
              WHERE produits.categorie_id = "Categorie".id
              AND produits.est_actif = true
            )`),
                        'nombre_produits'
                    ]
                ]
            },
            order: [['nom', 'ASC']]
        });

        // Construire l'arborescence
        const categoriesParentes = categories.filter(c => !c.parent_id);

        const arborescence = categoriesParentes.map(parent => {
            const parentJSON = parent.toJSON();
            return {
                ...parentJSON,
                sous_categories: categories
                    .filter(c => c.parent_id === parent.id)
                    .map(sc => sc.toJSON())
            };
        });

        res.json({
            categories: arborescence,
            total: categoriesParentes.length
        });

    } catch (error) {
        console.error('Erreur obtenir catégories:', error);
        res.status(500).json({
            message: 'Erreur lors de la récupération des catégories'
        });
    }
};

module.exports = {
    obtenirCategories
};
