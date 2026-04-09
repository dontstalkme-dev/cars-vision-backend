require('dotenv').config();
const db = require('./src/models');

async function resetAdmin() {
    try {
        await db.sequelize.authenticate();
        console.log('✓ Connexion DB réussie');

        const admin = await db.Utilisateur.findOne({
            where: { email: 'admin@carsvisionauto.cm' }
        });

        if (!admin) {
            console.log('❌ Compte admin introuvable');
            process.exit(1);
        }

        console.log('Compte admin trouvé:');
        console.log('- Email:', admin.email);
        console.log('- Rôle:', admin.role);
        console.log('- Statut:', admin.statut);
        console.log('- Tentatives:', admin.tentatives_connexion);

        await admin.update({
            statut: 'actif',
            tentatives_connexion: 0
        });

        console.log('✓ Compte admin réinitialisé');
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error.message);
        process.exit(1);
    }
}

resetAdmin();
