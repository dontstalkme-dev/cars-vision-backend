module.exports = (sequelize, DataTypes) => {
    const Coupon = sequelize.define('Coupon', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.ENUM('pourcentage', 'montant_fixe'),
            allowNull: false
        },
        valeur: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        montant_minimum: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        utilisation_max: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        utilisation_max_par_utilisateur: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        nombre_utilisations: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        date_debut: {
            type: DataTypes.DATE,
            allowNull: false
        },
        date_fin: {
            type: DataTypes.DATE,
            allowNull: false
        },
        est_actif: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        autorise_invites: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        tableName: 'coupons',
        timestamps: false
    });

    Coupon.associate = (models) => {
        Coupon.hasMany(models.Commande, { foreignKey: 'coupon_id', as: 'commandes' });
        Coupon.hasMany(models.UtilisationCoupon, { foreignKey: 'coupon_id', as: 'utilisations' });
    };

    return Coupon;
};
