module.exports = (sequelize, DataTypes) => {
    const UtilisationCoupon = sequelize.define('UtilisationCoupon', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        coupon_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        utilisateur_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        commande_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        email_invite: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cree_le: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'utilisations_coupon',
        timestamps: false
    });

    UtilisationCoupon.associate = (models) => {
        UtilisationCoupon.belongsTo(models.Coupon, { foreignKey: 'coupon_id', as: 'coupon' });
        UtilisationCoupon.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
        UtilisationCoupon.belongsTo(models.Commande, { foreignKey: 'commande_id', as: 'commande' });
    };

    return UtilisationCoupon;
};
