# Cars Vision Auto - Backend API v3.0

Plateforme E-commerce Automobile | Douala, Cameroun
**Paiement à la livraison uniquement**

## � Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack Technique](#stack-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [API Documentation](#api-documentation)
- [Tests](#tests)

## ✨ Fonctionnalités

- ✅ **Authentification JWT** avec rotation de tokens
- ✅ **E-commerce complet** : catalogue, panier, commandes
- ✅ **Gestion multi-sites** : Bonamoussadi & Ndokoti
- ✅ **Rendez-vous en ligne** avec créneaux horaires
- ✅ **Système d'avis** avec modération
- ✅ **Newsletter** avec désabonnement tokenisé
- ✅ **Dashboard admin** avec statistiques temps réel
- ✅ **Panier invité** avec fusion automatique au login
- ✅ **Rate limiting** et sécurité renforcée
- ✅ **Logging structuré** avec Winston

## 🛠 Stack Technique

- Node.js + Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Bcrypt

## �🚀 Démarrage rapide

### Identifiants Admin par défaut
- **Email**: `admin@carsvisionauto.cm`
- **Mot de passe**: `Admin@2026`

### Installation rapide
```bash
# 1. Créer la base de données
createdb carsvisionauto

# 2. Installer et configurer
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# 3. Démarrer
npm run dev
```

📖 **Documentation complète**: Voir `GUIDE_DEMARRAGE.md` et `QUICK_START.md`

## Technologies

- Node.js + Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Bcrypt

## Structure de la base de données

### Tables principales (en français sans accents)

1. **utilisateurs** - Gestion des comptes clients et admin
2. **tokens_refresh** - Tokens JWT refresh
3. **categories** - Catégories de produits
4. **produits** - Catalogue produits
5. **images_produits** - Photos des produits
6. **paniers** - Paniers clients et invités
7. **articles_panier** - Articles dans les paniers
8. **commandes** - Commandes (clients + invités)
9. **articles_commande** - Détails des commandes
10. **coupons** - Codes promo
11. **utilisations_coupon** - Historique utilisation coupons
12. **services** - Services mécaniques
13. **rendez_vous** - Rendez-vous garage
14. **avis** - Avis clients sur produits
15. **abonnes_newsletter** - Abonnés newsletter
16. **articles_blog** - Blog SEO
17. **parametres** - Configuration système
18. **journal_admin** - Logs actions admin

## Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer PostgreSQL dans .env
# DB_NAME=carsvisionauto
# DB_USER=postgres
# DB_PASSWORD=votre_mot_de_passe

# Créer la base de données PostgreSQL
createdb carsvisionauto

# Créer le compte admin initial et paramètres
npm run db:seed

# Démarrer en mode développement (sync auto)
npm run dev
```

## Compte admin par défaut

Après avoir exécuté `npm run db:seed`, vous pouvez vous connecter avec :
- **Email:** admin@carsvisionauto.cm
- **Mot de passe:** Admin@2026

⚠️ **Changez ce mot de passe immédiatement après la première connexion !**

## Gestion des rôles

### Inscription publique
- Route: `POST /api/auth/register`
- Rôle attribué: **client** (automatique, non modifiable)
- Accessible à tous sans authentification

### Création utilisateur backoffice
- Route: `POST /api/admin/users`
- Rôle attribué: **client** ou **admin** (choix de l'admin)
- Nécessite authentification admin

Voir [GESTION_ROLES.md](./GESTION_ROLES.md) pour plus de détails.

## Scripts disponibles

```bash
npm start              # Production
npm run dev            # Développement avec nodemon
npm run db:seed        # Créer admin initial + paramètres
npm run db:seed:admin  # Créer uniquement l'admin
```

## Endpoints de test

- `GET /` - Message de bienvenue
- `GET /api/health` - Vérification connexion DB

## Paiement à la livraison

Le système utilise uniquement le paiement à la livraison (cash on delivery).

### Champs dans la table `commandes`:
- `methode_paiement` = "cash_on_delivery" (valeur par défaut)
- `statut_paiement` = "PENDING" | "PAID" | "FAILED"

### Flux:
1. Client passe commande → `statut_paiement` = "PENDING"
2. Livreur livre + reçoit cash → Admin met à jour → "PAID"
3. Client refuse → Admin met à jour → "FAILED"

## Modules (8 modules, 75 User Stories)

- M1: Authentification & Utilisateurs (13 US)
- M2: Catalogue & Produits (10 US)
- M3: Panier & Commandes (13 US)
- M4: Rendez-vous & Services (9 US)
- M5: Avis Clients (6 US)
- M6: Marketing & Promotions (7 US)
- M7: Administration & Dashboard (11 US)
- M8: SEO & Contenu (5 US)

## Modèle invité + connecté

- Panier sans compte (guest_token)
- Commande invité possible
- Fusion panier lors de la connexion
- Suivi commande via tracking_token

## Licence

ISC
