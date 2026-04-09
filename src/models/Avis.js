module.exports = (sequelize, DataTypes) => {
    const Avis = sequelize.define('Avis', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        produit_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        utilisateur_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        note: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        commentaire: {
            type: DataTypes.TEXT
        },
        statut: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
            defaultValue: 'PENDING'
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
        tableName: 'avis',
        timestamps: false
    });

    Avis.associate = (models) => {
        Avis.belongsTo(models.Produit, { foreignKey: 'produit_id', as: 'produit' });
        Avis.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
    };

    return Avis;
};
