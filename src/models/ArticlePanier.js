module.exports = (sequelize, DataTypes) => {
    const ArticlePanier = sequelize.define('ArticlePanier', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        panier_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        produit_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        quantite: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        prix: {
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
        tableName: 'articles_panier',
        timestamps: false
    });

    ArticlePanier.associate = (models) => {
        ArticlePanier.belongsTo(models.Panier, { foreignKey: 'panier_id', as: 'panier' });
        ArticlePanier.belongsTo(models.Produit, { foreignKey: 'produit_id', as: 'produit' });
    };

    return ArticlePanier;
};
