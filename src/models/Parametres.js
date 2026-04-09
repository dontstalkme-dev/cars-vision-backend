module.exports = (sequelize, DataTypes) => {
    const Parametres = sequelize.define('Parametres', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        cle: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        valeur: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
            defaultValue: 'string'
        },
        description: {
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
        tableName: 'parametres',
        timestamps: false
    });

    return Parametres;
};
