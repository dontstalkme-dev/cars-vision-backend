module.exports = (sequelize, DataTypes) => {
    const ArticleBlog = sequelize.define('ArticleBlog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        titre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        contenu: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        resume: {
            type: DataTypes.TEXT
        },
        image: {
            type: DataTypes.STRING
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        meta_description: {
            type: DataTypes.STRING
        },
        statut: {
            type: DataTypes.ENUM('brouillon', 'publie'),
            defaultValue: 'brouillon'
        },
        date_publication: {
            type: DataTypes.DATE
        },
        auteur_id: {
            type: DataTypes.UUID,
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
        tableName: 'articles_blog',
        timestamps: false
    });

    ArticleBlog.associate = (models) => {
        ArticleBlog.belongsTo(models.Utilisateur, { foreignKey: 'auteur_id', as: 'auteur' });
    };

    return ArticleBlog;
};
