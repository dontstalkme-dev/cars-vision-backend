module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define('Service', {
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
        prix: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        duree_minutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
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
        tableName: 'services',
        timestamps: false
    });

    Service.associate = (models) => {
        Service.hasMany(models.RendezVous, { foreignKey: 'service_id', as: 'rendez_vous' });
    };

    return Service;
};
