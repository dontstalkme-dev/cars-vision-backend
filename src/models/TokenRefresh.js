module.exports = (sequelize, DataTypes) => {
    const TokenRefresh = sequelize.define('TokenRefresh', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        utilisateur_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('refresh', 'reset'),
            allowNull: false,
            defaultValue: 'refresh',
            comment: 'refresh = JWT refresh token | reset = token reset mot de passe'
        },
        expire_le: {
            type: DataTypes.DATE,
            allowNull: false
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
        tableName: 'tokens_refresh',
        timestamps: false
    });

    TokenRefresh.associate = (models) => {
        TokenRefresh.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
    };

    return TokenRefresh;
};
