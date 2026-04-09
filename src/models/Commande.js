module.exports = (sequelize, DataTypes) => {
    const Commande = sequelize.define('Commande', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        numero_commande: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        utilisateur_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        token_suivi: {
            type: DataTypes.UUID,
            allowNull: true
        },
        nom_invite: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email_invite: {
            type: DataTypes.STRING,
            allowNull: true
        },
        telephone_invite: {
            type: DataTypes.STRING,
            allowNull: true
        },
        zone_livraison_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        adresse_livraison: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        telephone_livraison: {
            type: DataTypes.STRING,
            allowNull: false
        },
        frais_livraison: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        sous_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        remise: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        coupon_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        statut: {
            type: DataTypes.ENUM('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'),
            defaultValue: 'EN_ATTENTE'
        },
        methode_paiement: {
            type: DataTypes.STRING,
            defaultValue: 'cash_on_delivery'
        },
        statut_paiement: {
            type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'),
            defaultValue: 'PENDING'
        },
        notes: {
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
        tableName: 'commandes',
        timestamps: false
    });

    Commande.associate = (models) => {
        Commande.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
        Commande.belongsTo(models.Coupon, { foreignKey: 'coupon_id', as: 'coupon' });
        Commande.belongsTo(models.ZoneLivraison, { foreignKey: 'zone_livraison_id', as: 'zone_livraison' });
        Commande.hasMany(models.ArticleCommande, { foreignKey: 'commande_id', as: 'articles' });
    };

    return Commande;
};
