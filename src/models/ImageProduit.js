module.exports = (sequelize, DataTypes) => {
    const ImageProduit = sequelize.define('ImageProduit', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        produit_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        est_principale: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        ordre: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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
        tableName: 'images_produits',
        timestamps: false
    });

    ImageProduit.associate = (models) => {
        ImageProduit.belongsTo(models.Produit, { foreignKey: 'produit_id', as: 'produit' });
    };

    return ImageProduit;
};
