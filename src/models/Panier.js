module.exports = (sequelize, DataTypes) => {
    const Panier = sequelize.define('Panier', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        utilisateur_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        token_invite: {
            type: DataTypes.UUID,
            allowNull: true
        },
        expire_le: {
            type: DataTypes.DATE,
            allowNull: true
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
        tableName: 'paniers',
        timestamps: false
    });

    Panier.associate = (models) => {
        Panier.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
        Panier.hasMany(models.ArticlePanier, { foreignKey: 'panier_id', as: 'articles' });
    };

    return Panier;
};
