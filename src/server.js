require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./models');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — liste blanche configurable
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (curl, Postman, mobile)
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        // En dev, autoriser tout localhost / 127.0.0.1
        if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) return callback(null, true);
        return callback(new Error(`CORS bloqué pour l'origine: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Token']
}));

// Rate limiting — protection brute-force sur l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // max 10 tentatives par fenêtre
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

// Rate limiting général (toutes les routes API)
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120,            // 120 req/min
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de requêtes. Réessayez dans 1 minute.' }
});

app.use('/api/', generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
const authRoutes = require('./routes/auth.routes');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const adminUtilisateurRoutes = require('./routes/admin.utilisateur.routes');
const categorieRoutes = require('./routes/categorie.routes');
const adminCategorieRoutes = require('./routes/admin.categorie.routes');
const produitRoutes = require('./routes/produit.routes');
const adminProduitRoutes = require('./routes/admin.produit.routes');
const panierRoutes = require('./routes/panier.routes');
const commandeRoutes = require('./routes/commande.routes');
const rendezvousRoutes = require('./routes/rendezvous.routes');
const avisRoutes = require('./routes/avis.routes');
const newsletterRoutes = require('./routes/newsletter.routes');
const adminPromotionRoutes = require('./routes/admin.promotion.routes');
const adminDashboardRoutes = require('./routes/admin.dashboard.routes');
const blogRoutes = require('./routes/blog.routes');
const seoRoutes = require('./routes/seo.routes');
const serviceRoutes = require('./routes/service.routes');
const adminServiceRoutes = require('./routes/admin.service.routes');
const zoneRoutes = require('./routes/zone.routes');
const adminZoneRoutes = require('./routes/admin.zone.routes');

// Appliquer rate limit strict sur les routes auth
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Route de test
app.get('/', (req, res) => {
    res.json({
        message: 'Cars Vision Auto API v3.0 - Paiement a la livraison',
        status: 'OK',
        version: '3.0.0',
        modules: {
            M1: 'Authentification & Utilisateurs - ACTIF',
            M2: 'Catalogue & Produits - ACTIF',
            M3: 'Panier & Commandes - ACTIF (Paiement à la livraison)',
            M4: 'Rendez-vous & Services - ACTIF (Services dynamiques)',
            M5: 'Avis & Notes Clients - ACTIF',
            M6: 'Marketing & Promotions - ACTIF (Newsletter + Promotions)',
            M7: 'Administration & Dashboard - ACTIF',
            M8: 'SEO & Contenu - ACTIF'
        }
    });
});

// Test connexion DB
app.get('/api/health', async (req, res) => {
    try {
        await db.sequelize.authenticate();
        res.json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Disconnected',
            error: error.message
        });
    }
});

// Monter les routes
app.use('/api/auth', authRoutes);
app.use('/api/users', utilisateurRoutes);
app.use('/api/admin/users', adminUtilisateurRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/admin/categories', adminCategorieRoutes);
app.use('/api/products', produitRoutes);
app.use('/api/admin/products', adminProduitRoutes);
app.use('/api/cart', panierRoutes);
app.use('/api/orders', commandeRoutes);
app.use('/api/appointments', rendezvousRoutes);
app.use('/api/reviews', avisRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin/promotions', adminPromotionRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin/services', adminServiceRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/admin/zones', adminZoneRoutes);
app.use('/api/contact', require('./routes/contact.routes'));

// Gestionnaire 404
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} introuvable` });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    logger.error('Erreur non gérée', { message: err.message, stack: err.stack, path: req.path });
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message
    });
});

// Demarrage serveur
const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('✓ Connexion à la base de données réussie');

        // Add missing columns before sync (each in own try/catch so one failure doesn't block others)
        const migrations = [
            `ALTER TABLE services ADD COLUMN IF NOT EXISTS image VARCHAR(255) DEFAULT NULL;`,
            `ALTER TABLE rendez_vous ADD COLUMN IF NOT EXISTS description_vehicule VARCHAR(255) DEFAULT NULL;`,
            `ALTER TABLE rendez_vous ALTER COLUMN marque_vehicule DROP NOT NULL;`,
            `ALTER TABLE rendez_vous ALTER COLUMN modele_vehicule DROP NOT NULL;`,
            `ALTER TABLE rendez_vous ALTER COLUMN annee_vehicule DROP NOT NULL;`,
            `ALTER TABLE services ALTER COLUMN prix DROP NOT NULL;`,
            `ALTER TABLE services ALTER COLUMN duree_minutes DROP NOT NULL;`,
        ];
        for (const sql of migrations) {
            try { await db.sequelize.query(sql); } catch (e) { /* already applied */ }
        }

        // Sync database (development only)
        if (process.env.NODE_ENV === 'development') {
            await db.sequelize.sync();
            logger.info('✓ Base de données synchronisée');
        }

        app.listen(PORT, () => {
            logger.info(`✓ Serveur démarré sur le port ${PORT}`);
            logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('✗ Erreur de démarrage:', { message: error.message });
        process.exit(1);
    }
};

startServer();

module.exports = app;
