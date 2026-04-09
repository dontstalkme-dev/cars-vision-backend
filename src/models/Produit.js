module.exports = (sequelize, DataTypes) => {
    const Produit = sequelize.define('Produit', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT
        },
        prix: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        categorie_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        est_actif: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        nombre_vues: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        nombre_ventes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        note_moyenne: {
            type: DataTypes.DECIMAL(2, 1),
            defaultValue: 0
        },
        nombre_avis: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        en_promotion: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        reduction_pourcentage: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0
        },
        prix_promotion: {
            type: DataTypes.DECIMAL(10, 2)
        },
        date_debut_promotion: {
            type: DataTypes.DATE
        },
        date_fin_promotion: {
            type: DataTypes.DATE
        },
        cree_le: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        modifie_le: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'produits',
        timestamps: false
    });

    Produit.associate = (models) => {
        Produit.belongsTo(models.Categorie, { foreignKey: 'categorie_id', as: 'categorie' });
        Produit.hasMany(models.ImageProduit, { foreignKey: 'produit_id', as: 'images' });
        Produit.hasMany(models.ArticlePanier, { foreignKey: 'produit_id', as: 'articles_panier' });
        Produit.hasMany(models.ArticleCommande, { foreignKey: 'produit_id', as: 'articles_commande' });
        Produit.hasMany(models.Avis, { foreignKey: 'produit_id', as: 'avis' });
    };

    return Produit;
};
