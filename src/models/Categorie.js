module.exports = (sequelize, DataTypes) => {
    const Categorie = sequelize.define('Categorie', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT
        },
        image: {
            type: DataTypes.STRING
        },
        parent_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        est_actif: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
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
        tableName: 'categories',
        timestamps: false
    });

    Categorie.associate = (models) => {
        Categorie.hasMany(models.Produit, { foreignKey: 'categorie_id', as: 'produits' });
        Categorie.belongsTo(models.Categorie, { foreignKey: 'parent_id', as: 'parent' });
        Categorie.hasMany(models.Categorie, { foreignKey: 'parent_id', as: 'sous_categories' });
    };

    return Categorie;
};
