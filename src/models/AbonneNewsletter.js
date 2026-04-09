module.exports = (sequelize, DataTypes) => {
    const AbonneNewsletter = sequelize.define('AbonneNewsletter', {
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
        token_desabonnement: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        },
        est_actif: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        consentement_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
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
        tableName: 'abonnes_newsletter',
        timestamps: false
    });

    return AbonneNewsletter;
};
