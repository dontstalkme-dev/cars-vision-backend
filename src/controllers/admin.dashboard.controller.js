const { Commande, Utilisateur, Produit, RendezVous, Avis, ArticleCommande, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Dashboard général - Vue d'ensemble
exports.getDashboard = async (req, res) => {
    try {
        const maintenant = new Date();
        const debut_mois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        // Fix : copie avant setDate pour ne pas muter maintenant
        const debut_semaine = new Date(new Date().setDate(new Date().getDate() - new Date().getDay()));
        const debut_jour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());

        // Statistiques générales
        const totalUtilisateurs = await Utilisateur.count();
        const totalClients = await Utilisateur.count({ where: { role: 'client' } });
        const totalProduits = await Produit.count();
        const totalCommandes = await Commande.count();
        const totalRendezVous = await RendezVous.count();

        // Commandes du mois
        const commandesMois = await Commande.findAll({
            where: {
                cree_le: { [Op.gte]: debut_mois }
            }
        });

        // Revenus du mois (BUG FIX : le champ correct est "total", pas "montant_total")
        const revenuMois = commandesMois.reduce((sum, cmd) => sum + parseFloat(cmd.total || 0), 0);

        // Commandes par statut
        const commandesParStatut = await Commande.findAll({
            attributes: [
                'statut',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['statut'],
            raw: true
        });

        // Produits en stock faible
        const produitsStockFaible = await Produit.findAll({
            where: {
                stock: { [Op.lt]: 5 },
                est_actif: true
            },
            attributes: ['id', 'nom', 'stock'],
            limit: 10
        });

        // Avis en attente de modération
        const avisEnAttente = await Avis.count({
            where: { statut: 'PENDING' }
        });

        // Rendez-vous du jour (BUG FIX : le champ est date_rdv (DATEONLY), pas date_heure)
        const aujourd_hui = new Date().toISOString().split('T')[0];
        const rendezvousDuJour = await RendezVous.count({
            where: {
                date_rdv: aujourd_hui
            }
        });

        // Commandes récentes (5 dernières) pour le dashboard
        const recentOrders = await Commande.findAll({
            limit: 5,
            order: [['cree_le', 'DESC']],
            include: [{
                model: Utilisateur,
                as: 'utilisateur',
                attributes: ['prenom', 'nom', 'email'],
                required: false
            }]
        });

        // Rendez-vous du jour pour le dashboard
        const recentAppointments = await RendezVous.findAll({
            where: { date_rdv: aujourd_hui },
            limit: 5,
            order: [['heure_debut', 'ASC']],
            include: [{
                model: Utilisateur,
                as: 'utilisateur',
                attributes: ['prenom', 'nom'],
                required: false
            }]
        });

        res.status(200).json({
            message: 'Dashboard',
            data: {
                statistiques_generales: {
                    total_utilisateurs: totalUtilisateurs,
                    total_clients: totalClients,
                    total_produits: totalProduits,
                    total_commandes: totalCommandes,
                    total_rendezvous: totalRendezVous
                },
                commandes_mois: {
                    nombre: commandesMois.length,
                    revenu: revenuMois.toFixed(2)
                },
                commandes_par_statut: commandesParStatut,
                produits_stock_faible: produitsStockFaible,
                avis_en_attente: avisEnAttente,
                rendezvous_du_jour: rendezvousDuJour,
                recentOrders,
                recentAppointments
            }
        });
    } catch (error) {
        logger.error('Erreur dashboard:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Statistiques détaillées par période
exports.getStatistiques = async (req, res) => {
    try {
        const { periode } = req.query; // jour, semaine, mois, annee
        let dateDebut;
        const maintenant = new Date();

        switch (periode) {
            case 'jour':
                dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
                break;
            case 'semaine':
                const jourSemaine = maintenant.getDay(); // 0=dim, 1=lun...
                const decalage = jourSemaine === 0 ? 6 : jourSemaine - 1; // lundi = début
                dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - decalage);
                break;
            case 'mois':
                dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
                break;
            case 'annee':
                dateDebut = new Date(maintenant.getFullYear(), 0, 1);
                break;
            default:
                dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        }

        const commandes = await Commande.findAll({
            where: {
                cree_le: { [Op.gte]: dateDebut }
            }
        });

        // BUG FIX : le champ correct est "total"
        const revenuTotal = commandes.reduce((sum, cmd) => sum + parseFloat(cmd.total || 0), 0);
        const nombreCommandes = commandes.length;
        const panier_moyen = nombreCommandes > 0 ? (revenuTotal / nombreCommandes).toFixed(2) : 0;

        // Produits les plus vendus (BUG FIX : le champ s'appelle "prix", pas "prix_unitaire")
        const produitsVendus = await sequelize.query(`
            SELECT p.id, p.nom, SUM(ac.quantite) as total_vendu, SUM(ac.prix * ac.quantite) as revenu
            FROM produits p
            JOIN articles_commande ac ON p.id = ac.produit_id
            JOIN commandes c ON ac.commande_id = c.id
            WHERE c.cree_le >= :dateDebut
            GROUP BY p.id, p.nom
            ORDER BY total_vendu DESC
            LIMIT 10
        `, {
            replacements: { dateDebut },
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json({
            message: 'Statistiques',
            periode,
            data: {
                nombre_commandes: nombreCommandes,
                revenu_total: revenuTotal.toFixed(2),
                panier_moyen,
                produits_les_plus_vendus: produitsVendus
            }
        });
    } catch (error) {
        logger.error('Erreur statistiques:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Historique des revenus mensuels pour les graphiques du dashboard
exports.getRevenueHistory = async (req, res) => {
    try {
        const mois = parseInt(req.query.mois) || 6;
        const results = [];
        const maintenant = new Date();

        for (let i = mois - 1; i >= 0; i--) {
            const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
            const fin = new Date(maintenant.getFullYear(), maintenant.getMonth() - i + 1, 0, 23, 59, 59);

            const commandes = await Commande.findAll({
                where: {
                    cree_le: { [Op.between]: [debut, fin] },
                    statut: { [Op.notIn]: ['ANNULEE'] }
                },
                attributes: ['total']
            });

            const revenu = commandes.reduce((sum, cmd) => sum + parseFloat(cmd.total || 0), 0);
            const nomMois = debut.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

            results.push({
                mois: nomMois,
                revenu: parseFloat(revenu.toFixed(2)),
                nombre_commandes: commandes.length
            });
        }

        res.status(200).json({
            message: 'Historique revenus',
            data: results
        });
    } catch (error) {
        logger.error('Erreur historique revenus:', { message: error.message });
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
