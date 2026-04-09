/**
 * Script de test pour la connexion admin
 * Ce script vérifie si l'admin existe et teste la connexion
 */

const bcrypt = require('bcrypt');
const db = require('./src/models');

async function testConnexionAdmin() {
    console.log('\n🔍 TEST DE CONNEXION ADMIN\n');
    console.log('='.repeat(50));

    try {
        // 1. Connexion à la base de données
        console.log('\n1️⃣  Connexion à la base de données...');
        await db.sequelize.authenticate();
        console.log('✅ Connexion réussie');

        // 2. Vérifier si l'admin existe
        console.log('\n2️⃣  Recherche du compte admin...');
        const admin = await db.Utilisateur.findOne({
            where: { email: 'admin@carsvisionauto.cm' }
        });

        if (!admin) {
            console.log('❌ Compte admin NON TROUVÉ');
            console.log('\n💡 Solution: Exécutez les seeders:');
            console.log('   npx sequelize-cli db:seed:all');
            process.exit(1);
        }

        console.log('✅ Compte admin trouvé');
        console.log('\n📋 Informations du compte:');
        console.log('   - ID:', admin.id);
        console.log('   - Email:', admin.email);
        console.log('   - Prénom:', admin.prenom);
        console.log('   - Nom:', admin.nom);
        console.log('   - Rôle:', admin.role);
        console.log('   - Statut:', admin.statut);
        console.log('   - Tentatives connexion:', admin.tentatives_connexion);

        // 3. Tester le mot de passe
        console.log('\n3️⃣  Test du mot de passe...');
        const motDePasseTest = 'Admin@2026';
        const motDePasseValide = await bcrypt.compare(motDePasseTest, admin.mot_de_passe);

        if (!motDePasseValide) {
            console.log('❌ Mot de passe INCORRECT');
            console.log('\n💡 Le mot de passe hashé ne correspond pas à "Admin@2026"');
            console.log('   Réexécutez les seeders pour réinitialiser le mot de passe');
            process.exit(1);
        }

        console.log('✅ Mot de passe correct');

        // 4. Vérifier le statut du compte
        console.log('\n4️⃣  Vérification du statut...');
        if (admin.statut === 'bloque') {
            console.log('❌ Compte BLOQUÉ');
            console.log('\n💡 Solution: Débloquez le compte manuellement dans la base de données');
            process.exit(1);
        }

        if (admin.statut !== 'actif') {
            console.log('⚠️  Statut:', admin.statut);
            console.log('   Le compte devrait être "actif"');
        } else {
            console.log('✅ Compte actif');
        }

        // 5. Résumé
        console.log('\n' + '='.repeat(50));
        console.log('\n✅ TOUS LES TESTS SONT PASSÉS\n');
        console.log('📝 Identifiants de connexion:');
        console.log('   Email: admin@carsvisionauto.cm');
        console.log('   Mot de passe: Admin@2026');
        console.log('\n🌐 Vous pouvez maintenant vous connecter sur:');
        console.log('   http://localhost:5173/login');
        console.log('\n' + '='.repeat(50) + '\n');

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        console.error('\n📋 Détails:', error);
        process.exit(1);
    } finally {
        await db.sequelize.close();
    }
}

// Exécuter le test
testConnexionAdmin();
