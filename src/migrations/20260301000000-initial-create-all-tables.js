'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. utilisateurs
    await queryInterface.createTable('utilisateurs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      mot_de_passe: { type: Sequelize.STRING, allowNull: false },
      prenom: { type: Sequelize.STRING, allowNull: false },
      nom: { type: Sequelize.STRING, allowNull: false },
      telephone: { type: Sequelize.STRING, allowNull: false },
      adresse: { type: Sequelize.TEXT },
      role: { type: Sequelize.ENUM('client', 'admin'), defaultValue: 'client' },
      statut: { type: Sequelize.ENUM('actif', 'bloque'), defaultValue: 'actif' },
      tentatives_connexion: { type: Sequelize.INTEGER, defaultValue: 0 },
      derniere_connexion: { type: Sequelize.DATE },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 2. tokens_refresh
    await queryInterface.createTable('tokens_refresh', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      token: { type: Sequelize.TEXT, allowNull: false },
      utilisateur_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      type: { type: Sequelize.ENUM('refresh', 'reset'), allowNull: false, defaultValue: 'refresh' },
      expire_le: { type: Sequelize.DATE, allowNull: false },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 3. categories
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nom: { type: Sequelize.STRING, allowNull: false, unique: true },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      image: { type: Sequelize.STRING },
      parent_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 4. produits
    await queryInterface.createTable('produits', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nom: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      prix: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      stock: { type: Sequelize.INTEGER, defaultValue: 0 },
      categorie_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: false },
      nombre_vues: { type: Sequelize.INTEGER, defaultValue: 0 },
      nombre_ventes: { type: Sequelize.INTEGER, defaultValue: 0 },
      note_moyenne: { type: Sequelize.DECIMAL(2, 1), defaultValue: 0 },
      nombre_avis: { type: Sequelize.INTEGER, defaultValue: 0 },
      en_promotion: { type: Sequelize.BOOLEAN, defaultValue: false },
      reduction_pourcentage: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      prix_promotion: { type: Sequelize.DECIMAL(10, 2) },
      date_debut_promotion: { type: Sequelize.DATE },
      date_fin_promotion: { type: Sequelize.DATE },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 5. images_produits
    await queryInterface.createTable('images_produits', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      produit_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'produits', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      url: { type: Sequelize.STRING, allowNull: false },
      est_principale: { type: Sequelize.BOOLEAN, defaultValue: false },
      ordre: { type: Sequelize.INTEGER, defaultValue: 0 },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 6. paniers
    await queryInterface.createTable('paniers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      utilisateur_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      token_invite: { type: Sequelize.UUID, allowNull: true },
      expire_le: { type: Sequelize.DATE, allowNull: true },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 7. articles_panier
    await queryInterface.createTable('articles_panier', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      panier_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'paniers', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      produit_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'produits', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      quantite: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      prix: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 8. coupons
    await queryInterface.createTable('coupons', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      type: { type: Sequelize.ENUM('pourcentage', 'montant_fixe'), allowNull: false },
      valeur: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      montant_minimum: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      utilisation_max: { type: Sequelize.INTEGER, allowNull: true },
      utilisation_max_par_utilisateur: { type: Sequelize.INTEGER, defaultValue: 1 },
      nombre_utilisations: { type: Sequelize.INTEGER, defaultValue: 0 },
      date_debut: { type: Sequelize.DATE, allowNull: false },
      date_fin: { type: Sequelize.DATE, allowNull: false },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      autorise_invites: { type: Sequelize.BOOLEAN, defaultValue: false },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 9. zones_livraison
    await queryInterface.createTable('zones_livraison', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nom: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      frais_livraison: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      delai_livraison_jours: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      ordre: { type: Sequelize.INTEGER, defaultValue: 0 },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 10. commandes
    await queryInterface.createTable('commandes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      numero_commande: { type: Sequelize.STRING, allowNull: false, unique: true },
      utilisateur_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      token_suivi: { type: Sequelize.UUID, allowNull: true },
      nom_invite: { type: Sequelize.STRING, allowNull: true },
      email_invite: { type: Sequelize.STRING, allowNull: true },
      telephone_invite: { type: Sequelize.STRING, allowNull: true },
      zone_livraison_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'zones_livraison', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      adresse_livraison: { type: Sequelize.TEXT, allowNull: false },
      telephone_livraison: { type: Sequelize.STRING, allowNull: false },
      frais_livraison: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      sous_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      remise: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      coupon_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'coupons', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      statut: { type: Sequelize.ENUM('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE'), defaultValue: 'EN_ATTENTE' },
      methode_paiement: { type: Sequelize.STRING, defaultValue: 'cash_on_delivery' },
      statut_paiement: { type: Sequelize.ENUM('PENDING', 'PAID', 'FAILED'), defaultValue: 'PENDING' },
      notes: { type: Sequelize.TEXT },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 11. articles_commande
    await queryInterface.createTable('articles_commande', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      commande_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'commandes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      produit_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'produits', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      nom_produit: { type: Sequelize.STRING, allowNull: false },
      quantite: { type: Sequelize.INTEGER, allowNull: false },
      prix: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      sous_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 12. utilisations_coupon
    await queryInterface.createTable('utilisations_coupon', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      coupon_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'coupons', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      utilisateur_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      commande_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'commandes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      email_invite: { type: Sequelize.STRING, allowNull: true },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 13. services
    await queryInterface.createTable('services', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nom: { type: Sequelize.STRING, allowNull: false, unique: true },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      prix: { type: Sequelize.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
      duree_minutes: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      image: { type: Sequelize.STRING, allowNull: true },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      ordre: { type: Sequelize.INTEGER, defaultValue: 0 },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 14. rendez_vous
    await queryInterface.createTable('rendez_vous', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      utilisateur_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      nom_client: { type: Sequelize.STRING, allowNull: true },
      telephone_client: { type: Sequelize.STRING, allowNull: true },
      email_client: { type: Sequelize.STRING, allowNull: true },
      service_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      service_nom: { type: Sequelize.STRING, allowNull: false },
      date_rdv: { type: Sequelize.DATEONLY, allowNull: false },
      heure_debut: { type: Sequelize.TIME, allowNull: false },
      heure_fin: { type: Sequelize.TIME, allowNull: true },
      description_vehicule: { type: Sequelize.STRING, allowNull: true },
      marque_vehicule: { type: Sequelize.STRING, allowNull: true },
      modele_vehicule: { type: Sequelize.STRING, allowNull: true },
      annee_vehicule: { type: Sequelize.INTEGER, allowNull: true },
      plaque_vehicule: { type: Sequelize.STRING },
      site: { type: Sequelize.STRING, allowNull: false, defaultValue: 'bonamoussadi' },
      besoin_remorquage: { type: Sequelize.BOOLEAN, defaultValue: false },
      besoin_navette: { type: Sequelize.BOOLEAN, defaultValue: false },
      voiture_courtoisie: { type: Sequelize.BOOLEAN, defaultValue: false },
      offre_speciale: { type: Sequelize.STRING, allowNull: true },
      statut: { type: Sequelize.ENUM('EN_ATTENTE', 'CONFIRME', 'TERMINE', 'ANNULE'), defaultValue: 'EN_ATTENTE' },
      notes_client: { type: Sequelize.TEXT },
      notes_mecanicien: { type: Sequelize.TEXT },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 15. avis
    await queryInterface.createTable('avis', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      produit_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'produits', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      utilisateur_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      note: { type: Sequelize.INTEGER, allowNull: false },
      commentaire: { type: Sequelize.TEXT },
      statut: { type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 16. abonnes_newsletter
    await queryInterface.createTable('abonnes_newsletter', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      token_desabonnement: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: true },
      consentement_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 17. articles_blog
    await queryInterface.createTable('articles_blog', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      titre: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      contenu: { type: Sequelize.TEXT, allowNull: false },
      resume: { type: Sequelize.TEXT },
      image: { type: Sequelize.STRING },
      tags: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      meta_description: { type: Sequelize.STRING },
      statut: { type: Sequelize.ENUM('brouillon', 'publie'), defaultValue: 'brouillon' },
      date_publication: { type: Sequelize.DATE },
      auteur_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 18. parametres
    await queryInterface.createTable('parametres', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cle: { type: Sequelize.STRING, allowNull: false, unique: true },
      valeur: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.ENUM('string', 'number', 'boolean', 'json'), defaultValue: 'string' },
      description: { type: Sequelize.TEXT },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      modifie_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 19. journal_admin
    await queryInterface.createTable('journal_admin', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      utilisateur_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      action: { type: Sequelize.STRING, allowNull: false },
      type_action: { type: Sequelize.ENUM('connexion', 'produit', 'commande', 'utilisateur', 'autre'), allowNull: false },
      details: { type: Sequelize.JSONB },
      adresse_ip: { type: Sequelize.STRING },
      cree_le: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },

  async down(queryInterface) {
    // Drop in reverse order
    const tables = [
      'journal_admin', 'parametres', 'articles_blog', 'abonnes_newsletter',
      'avis', 'rendez_vous', 'services', 'utilisations_coupon',
      'articles_commande', 'commandes', 'zones_livraison', 'coupons',
      'articles_panier', 'paniers', 'images_produits', 'produits',
      'categories', 'tokens_refresh', 'utilisateurs'
    ];
    for (const table of tables) {
      await queryInterface.dropTable(table, { cascade: true });
    }
    // Drop ENUM types
    const enums = [
      'enum_utilisateurs_role', 'enum_utilisateurs_statut',
      'enum_tokens_refresh_type', 'enum_commandes_statut',
      'enum_commandes_statut_paiement', 'enum_coupons_type',
      'enum_rendez_vous_statut', 'enum_avis_statut',
      'enum_articles_blog_statut', 'enum_parametres_type',
      'enum_journal_admin_type_action'
    ];
    for (const e of enums) {
      try { await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${e}";`); } catch (_) {}
    }
  }
};
