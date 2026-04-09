module.exports = (sequelize, DataTypes) => {
    const Utilisateur = sequelize.define('Utilisateur', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        mot_de_passe: {
            type: DataTypes.STRING,
            allowNull: false
        },
        prenom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        telephone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        adresse: {
            type: DataTypes.TEXT
        },
        role: {
            type: DataTypes.ENUM('client', 'admin'),
            defaultValue: 'client'
        },
        statut: {
            type: DataTypes.ENUM('actif', 'bloque'),
            defaultValue: 'actif'
        },
        tentatives_connexion: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        derniere_connexion: {
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
        tableName: 'utilisateurs',
        timestamps: false
    });

    Utilisateur.associate = (models) => {
        Utilisateur.hasMany(models.TokenRefresh, { foreignKey: 'utilisateur_id', as: 'tokens_refresh' });
        Utilisateur.hasOne(models.Panier, { foreignKey: 'utilisateur_id', as: 'panier' });
        Utilisateur.hasMany(models.Commande, { foreignKey: 'utilisateur_id', as: 'commandes' });
        Utilisateur.hasMany(models.RendezVous, { foreignKey: 'utilisateur_id', as: 'rendez_vous' });
        Utilisateur.hasMany(models.Avis, { foreignKey: 'utilisateur_id', as: 'avis' });
    };

    return Utilisateur;
};
