# Collection Bruno - Cars Vision Auto API

Collection de tests pour l'API Cars Vision Auto v3.0

## Installation

1. Installer Bruno: https://www.usebruno.com/
2. Ouvrir Bruno
3. Ouvrir la collection: `File > Open Collection` → Sélectionner le dossier `bruno-collection`

## Configuration

### Environnement Development

Les variables d'environnement sont dans `environments/Development.bru`:

```
base_url: http://localhost:5000
access_token: (auto-rempli après connexion)
refresh_token: (auto-rempli après connexion)
admin_access_token: (auto-rempli après connexion admin)
admin_refresh_token: (auto-rempli après connexion admin)
user_id: (auto-rempli après inscription)
guest_token: (pour tests panier invité)
```

## Ordre d'exécution recommandé

### Module M1 - Authentification

1. `M1 - Auth/01 - Health Check` - Vérifier que l'API fonctionne
2. `M1 - Auth/02 - Inscription Client` - Créer un compte client
3. `M1 - Auth/03 - Connexion Admin` - Se connecter en admin
4. `M1 - Auth/04 - Connexion Client` - Se reconnecter en client
5. `M1 - Auth/05 - Rafraichir Token` - Tester le refresh token
6. `M1 - Utilisateur/01 - Mon Profil` - Voir son profil
7. `M1 - Admin/01 - Liste Utilisateurs` - Lister tous les utilisateurs

### Module M2 - Catalogue & Produits

8. `M2 - Categories Admin/01 - Creer Categorie` - Créer une catégorie (sauvegarde categorie_id)
9. `M2 - Categories/01 - Voir Categories (Public)` - Voir les catégories
10. `M2 - Produits Admin/01 - Creer Produit` - Créer un produit (sauvegarde produit_id)
11. `M2 - Produits Admin/02 - Ajouter Image Produit` - Ajouter une image
12. `M2 - Produits Admin/03 - Modifier Produit` - Activer le produit (est_actif: true)
13. `M2 - Produits Public/01 - Liste Produits` - Voir le catalogue public
14. `M2 - Produits Public/02 - Fiche Produit` - Voir les détails
15. `M2 - Produits Public/03 - Rechercher Produits` - Rechercher
16. `M2 - Produits Admin/04 - Mettre a Jour Stock` - Tester les alertes stock

Après avoir exécuté `npm run db:seed`:

```
Email: admin@carsvisionauto.cm
Mot de passe: Admin@2026
```

## Tests automatiques

Chaque requête contient des tests automatiques qui vérifient:
- Le code de statut HTTP
- La structure de la réponse
- Les données retournées
- La sauvegarde automatique des tokens dans l'environnement

Les tests s'exécutent automatiquement après chaque requête.

## Variables auto-remplies

Les requêtes suivantes remplissent automatiquement les variables d'environnement:

- **Inscription Client**: `access_token`, `refresh_token`, `user_id`
- **Connexion Admin**: `admin_access_token`, `admin_refresh_token`
- **Connexion Client**: `access_token`, `refresh_token`
- **Rafraîchir Token**: `access_token`, `refresh_token` (nouveaux tokens)

## Notes importantes

### Reset mot de passe
Pour tester le reset de mot de passe:
1. Exécuter `06 - Demander Reset Password`
2. Vérifier les logs du serveur pour obtenir le token
3. Copier le token dans `07 - Reinitialiser Password`

### Bloquer/Débloquer utilisateur
Pour tester le blocage:
1. Copier l'ID d'un utilisateur client depuis la liste
2. Remplacer `{{user_id}}` dans l'URL
3. Exécuter la requête

### Modifier le rôle
Pour promouvoir un client en admin:
1. Utiliser l'ID d'un utilisateur client
2. Exécuter `05 - Modifier Role Utilisateur` avec `role: "admin"`

## Structure de la collection

```
bruno-collection/
├── bruno.json                    # Configuration de la collection
├── environments/
│   └── Development.bru          # Variables d'environnement
├── M1 - Auth/                   # Authentification (8 requêtes)
├── M1 - Utilisateur/            # Gestion profil (3 requêtes)
├── M1 - Admin/                  # Administration (5 requêtes)
├── M2 - Categories/             # Catégories publiques (1 requête)
├── M2 - Categories Admin/       # Gestion catégories (3 requêtes)
├── M2 - Produits Admin/         # Gestion produits (6 requêtes)
├── M2 - Produits Public/        # Catalogue public (3 requêtes)
├── M3 - Panier/                 # Gestion panier (6 requêtes)
├── M3 - Commandes/              # Gestion commandes (6 requêtes)
├── M4 - Rendezvous/             # Rendez-vous (6 requêtes)
├── M5 - Avis/                   # Avis & Notations (6 requêtes)
├── M6 - Newsletter/             # Newsletter (3 requêtes)
├── M6 - Promotions/             # Promotions (4 requêtes)
├── M7 - Dashboard/              # Dashboard (2 requêtes)
├── M7 - Commandes Admin/        # Gestion commandes admin (4 requêtes)
├── M7 - Rendezvous Admin/       # Gestion rendez-vous admin (5 requêtes)
├── M7 - Parametres/             # Paramètres système (2 requêtes)
├── M7 - Journal/                # Journal d'audit (2 requêtes)
├── M8 - Blog/                   # Blog (7 requêtes)
└── M8 - SEO/                    # SEO & Métadonnées (5 requêtes)
```

**Total: 100+ requêtes de test**

## Modules inclus

- **M1**: Authentification & Utilisateurs (16 requêtes)
- **M2**: Catalogue & Produits (13 requêtes)
- **M3**: Panier & Commandes (12 requêtes)
- **M4**: Rendez-vous & Services (6 requêtes)
- **M5**: Avis & Notations (7 requêtes)
- **M6**: Newsletter & Promotions (7 requêtes)
- **M7**: Administration & Dashboard (15 requêtes)
- **M8**: Blog & SEO (12 requêtes)

## Dépannage

### Erreur 401 Unauthorized
- Vérifiez que vous êtes connecté
- Vérifiez que le token n'est pas expiré
- Reconnectez-vous pour obtenir un nouveau token

### Erreur 403 Forbidden
- Vérifiez que vous utilisez le bon token (admin vs client)
- Certaines routes nécessitent le rôle admin

### Token expiré
- Utilisez la requête `05 - Rafraichir Token`
- Ou reconnectez-vous

## Support

Pour plus d'informations, consultez:
- `TESTS_MODULE_M1.md` - Documentation des endpoints
- `GESTION_ROLES.md` - Gestion des rôles et permissions
