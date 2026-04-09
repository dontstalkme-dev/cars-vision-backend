const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: dbConfig.logging,
        dialectOptions: dbConfig.dialectOptions || {}
    });
} else {
    sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: dbConfig.dialect,
            logging: dbConfig.logging,
            dialectOptions: dbConfig.dialectOptions || {}
        }
    );
}

const db = {
    sequelize,
    Sequelize,
    Utilisateur: require('./Utilisateur')(sequelize, Sequelize.DataTypes),
    TokenRefresh: require('./TokenRefresh')(sequelize, Sequelize.DataTypes),
    Categorie: require('./Categorie')(sequelize, Sequelize.DataTypes),
    Produit: require('./Produit')(sequelize, Sequelize.DataTypes),
    ImageProduit: require('./ImageProduit')(sequelize, Sequelize.DataTypes),
    Panier: require('./Panier')(sequelize, Sequelize.DataTypes),
    ArticlePanier: require('./ArticlePanier')(sequelize, Sequelize.DataTypes),
    Commande: require('./Commande')(sequelize, Sequelize.DataTypes),
    ArticleCommande: require('./ArticleCommande')(sequelize, Sequelize.DataTypes),
    Coupon: require('./Coupon')(sequelize, Sequelize.DataTypes),
    UtilisationCoupon: require('./UtilisationCoupon')(sequelize, Sequelize.DataTypes),
    Service: require('./Service')(sequelize, Sequelize.DataTypes),
    RendezVous: require('./RendezVous')(sequelize, Sequelize.DataTypes),
    Avis: require('./Avis')(sequelize, Sequelize.DataTypes),
    AbonneNewsletter: require('./AbonneNewsletter')(sequelize, Sequelize.DataTypes),
    ArticleBlog: require('./ArticleBlog')(sequelize, Sequelize.DataTypes),
    Parametres: require('./Parametres')(sequelize, Sequelize.DataTypes),
    JournalAdmin: require('./JournalAdmin')(sequelize, Sequelize.DataTypes),
    ZoneLivraison: require('./ZoneLivraison')(sequelize, Sequelize.DataTypes)
};

// Relations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
