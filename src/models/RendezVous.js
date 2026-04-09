module.exports = (sequelize, DataTypes) => {
    const RendezVous = sequelize.define('RendezVous', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        utilisateur_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        nom_client: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Nom du client (pour les réservations sans compte)'
        },
        telephone_client: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Téléphone du client (pour les réservations sans compte)'
        },
        email_client: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Email du client (optionnel, pour les réservations sans compte)'
        },
        service_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        service_nom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date_rdv: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        heure_debut: {
            type: DataTypes.TIME,
            allowNull: false
        },
        heure_fin: {
            type: DataTypes.TIME,
            allowNull: true
        },
        description_vehicule: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Description libre du véhicule (marque, modèle, année, plaque)'
        },
        marque_vehicule: {
            type: DataTypes.STRING,
            allowNull: true
        },
        modele_vehicule: {
            type: DataTypes.STRING,
            allowNull: true
        },
        annee_vehicule: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        plaque_vehicule: {
            type: DataTypes.STRING
        },
        site: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'bonamoussadi',
            validate: {
                isIn: [['bonamoussadi', 'ndokoti']]
            },
            comment: 'Site du garage pour le rendez-vous'
        },
        besoin_remorquage: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Le véhicule doit être remorqué'
        },
        besoin_navette: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Client a besoin du service de navette'
        },
        voiture_courtoisie: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Client demande une voiture de courtoisie'
        },
        offre_speciale: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Offre spéciale sélectionnée (ex: lavage gratuit)'
        },
        statut: {
            type: DataTypes.ENUM('EN_ATTENTE', 'CONFIRME', 'TERMINE', 'ANNULE'),
            defaultValue: 'EN_ATTENTE'
        },
        notes_client: {
            type: DataTypes.TEXT
        },
        notes_mecanicien: {
            type: DataTypes.TEXT
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
        tableName: 'rendez_vous',
        timestamps: false
    });

    RendezVous.associate = (models) => {
        RendezVous.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
        RendezVous.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
    };

    return RendezVous;
};
