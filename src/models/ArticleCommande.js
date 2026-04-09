module.exports = (sequelize, DataTypes) => {
    const ArticleCommande = sequelize.define('ArticleCommande', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        commande_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        produit_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        nom_produit: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quantite: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        prix: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        sous_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
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
        tableName: 'articles_commande',
        timestamps: false
    });

    ArticleCommande.associate = (models) => {
        ArticleCommande.belongsTo(models.Commande, { foreignKey: 'commande_id', as: 'commande' });
        ArticleCommande.belongsTo(models.Produit, { foreignKey: 'produit_id', as: 'produit' });
    };

    return ArticleCommande;
};
