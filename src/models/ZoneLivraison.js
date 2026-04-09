module.exports = (sequelize, DataTypes) => {
    const ZoneLivraison = sequelize.define('ZoneLivraison', {
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
        description: {
            type: DataTypes.TEXT
        },
        frais_livraison: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        delai_livraison_jours: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 3
        },
        est_actif: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
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
        tableName: 'zones_livraison',
        timestamps: false
    });

    ZoneLivraison.associate = (models) => {
        ZoneLivraison.hasMany(models.Commande, { foreignKey: 'zone_livraison_id', as: 'commandes' });
    };

    return ZoneLivraison;
};
