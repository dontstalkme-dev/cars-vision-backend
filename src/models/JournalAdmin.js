module.exports = (sequelize, DataTypes) => {
    const JournalAdmin = sequelize.define('JournalAdmin', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        utilisateur_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type_action: {
            type: DataTypes.ENUM('connexion', 'produit', 'commande', 'utilisateur', 'autre'),
            allowNull: false
        },
        details: {
            type: DataTypes.JSONB
        },
        adresse_ip: {
            type: DataTypes.STRING
        },
        cree_le: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'journal_admin',
        timestamps: false
    });

    JournalAdmin.associate = (models) => {
        JournalAdmin.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });
    };

    return JournalAdmin;
};
