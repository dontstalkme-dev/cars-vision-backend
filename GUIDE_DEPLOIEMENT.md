# Guide de Déploiement — Cars Vision Auto

## Architecture de déploiement (100% gratuit)

| Composant | Service | Plan |
|-----------|---------|------|
| **Base de données** PostgreSQL | [Neon](https://neon.tech) | Free (0.5 Go stockage) |
| **Backend** Node.js/Express | [Render](https://render.com) | Free (spins down après 15min d'inactivité) |
| **Frontend** React/Vite | [Vercel](https://vercel.com) | Free (illimité pour sites statiques) |

---

## ÉTAPE 1 : Base de données PostgreSQL sur Neon

### 1.1 Créer un compte Neon
1. Aller sur **https://neon.tech**
2. Cliquer sur **"Sign Up"** (inscription avec GitHub ou email)
3. Confirmer votre email

### 1.2 Créer un projet
1. Cliquer **"New Project"**
2. **Project name** : `carsvisionauto`
3. **Region** : choisir la plus proche (ex: `AWS eu-central-1` pour l'Europe)
4. Cliquer **"Create Project"**

### 1.3 Récupérer l'URL de connexion
1. Après la création, Neon affiche le **Connection String**
2. Il ressemble à :
   ```
   postgresql://neondb_owner:AbCdEf123@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Copiez cette URL** — c'est votre `DATABASE_URL` pour le backend

### 1.4 Initialiser la base de données
Depuis votre terminal local (dans le dossier `Car_Vision`) :

```bash
# Définir temporairement DATABASE_URL pour les migrations
# Windows PowerShell :
$env:DATABASE_URL="postgresql://neondb_owner:VOTRE_MOT_DE_PASSE@ep-XXXX.REGION.aws.neon.tech/neondb?sslmode=require"
$env:NODE_ENV="production"

# Exécuter les migrations
npx sequelize-cli db:migrate

# Créer le compte admin initial + données de base
npx sequelize-cli db:seed:all
```

> **Vérification** : Allez sur le dashboard Neon → Tables pour voir vos tables créées.

---

## ÉTAPE 2 : Backend Node.js sur Render

### 2.1 Préparer le code
1. Votre projet `Car_Vision` doit être dans un **repository Git** (GitHub ou GitLab)
2. Si pas encore fait :
   ```bash
   cd R:\Projects\Car_Vision
   git init
   git add .
   git commit -m "Prêt pour déploiement"
   ```
3. Créer un repo sur GitHub et pousser :
   ```bash
   git remote add origin https://github.com/VOTRE_USER/carsvision-backend.git
   git push -u origin main
   ```

### 2.2 Créer un compte Render
1. Aller sur **https://render.com**
2. Cliquer **"Get Started for Free"** (inscription avec GitHub recommandée)

### 2.3 Déployer le backend
1. Dashboard Render → **"New +"** → **"Web Service"**
2. Connecter votre repo GitHub `carsvision-backend`
3. Configurer :

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `carsvision-api` |
| **Region** | `Frankfurt (EU Central)` (proche de Neon) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.4 Configurer les variables d'environnement
Dans Render → votre service → **"Environment"** → **"Add Environment Variable"** :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://neondb_owner:xxx@ep-xxx.neon.tech/neondb?sslmode=require` (l'URL de Neon) |
| `JWT_ACCESS_SECRET` | *(générer avec `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)* |
| `JWT_REFRESH_SECRET` | *(générer un autre secret différent)* |
| `JWT_ACCESS_EXPIRY` | `1h` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `votre_email@gmail.com` |
| `EMAIL_PASSWORD` | `votre_mot_de_passe_application` |
| `EMAIL_FROM` | `Cars Vision Auto <votre_email@gmail.com>` |
| `FRONTEND_URL` | `https://carsvision.vercel.app` *(à remplir après l'étape 3)* |
| `BASE_URL` | `https://carsvision-api.onrender.com` *(URL de votre service Render)* |
| `CORS_ORIGIN` | `https://carsvision.vercel.app` *(à remplir après l'étape 3)* |

> **Note Gmail** : Pour `EMAIL_PASSWORD`, vous devez utiliser un **mot de passe d'application** Gmail :
> 1. Aller sur https://myaccount.google.com/apppasswords
> 2. Créer un mot de passe pour "Mail" → "Autre" → nommer "Cars Vision"
> 3. Copier le mot de passe de 16 caractères généré

### 2.5 Vérifier le déploiement
1. Cliquer **"Manual Deploy"** → **"Deploy latest commit"**
2. Attendre que le build finisse (2-3 minutes)
3. Votre API sera accessible à : `https://carsvision-api.onrender.com`
4. Tester : ouvrir `https://carsvision-api.onrender.com/api/health` — doit retourner `{"status":"OK","database":"Connected"}`

### 2.6 Exécuter les seeds (première fois uniquement)
Render → votre service → onglet **"Shell"** :
```bash
npx sequelize-cli db:seed:all
```

> **Important** : Le plan gratuit de Render met le service en veille après 15 min d'inactivité. La première requête après une pause prend ~30 secondes.

---

## ÉTAPE 3 : Frontend React sur Vercel

### 3.1 Préparer le code
1. Votre projet `Car_Vision_Frontend` doit être dans un repo Git séparé :
   ```bash
   cd R:\Projects\Car_Vision_Frontend
   git init
   git add .
   git commit -m "Prêt pour déploiement"
   git remote add origin https://github.com/VOTRE_USER/carsvision-frontend.git
   git push -u origin main
   ```

### 3.2 Créer un compte Vercel
1. Aller sur **https://vercel.com**
2. Cliquer **"Sign Up"** (inscription avec GitHub recommandée)

### 3.3 Déployer le frontend
1. Dashboard Vercel → **"Add New..."** → **"Project"**
2. Importer le repo `carsvision-frontend`
3. Vercel détecte automatiquement **Vite** comme framework
4. Configurer la variable d'environnement :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://carsvision-api.onrender.com/api` |

5. Cliquer **"Deploy"**
6. En 1-2 minutes, votre frontend sera en ligne à : `https://carsvision-frontend.vercel.app`

### 3.4 Mettre à jour les URLs backend
Maintenant que vous connaissez l'URL du frontend, retournez sur **Render** et mettez à jour :
- `FRONTEND_URL` = `https://carsvision-frontend.vercel.app`
- `CORS_ORIGIN` = `https://carsvision-frontend.vercel.app`

Puis cliquer **"Manual Deploy"** sur Render pour appliquer.

---

## ÉTAPE 4 : Vérifications finales

### 4.1 Tester le flux complet
1. Ouvrir `https://carsvision-frontend.vercel.app`
2. Vérifier que la page d'accueil charge bien
3. Vérifier que les produits s'affichent (connexion API OK)
4. Tester la connexion admin : `admin@carsvisionauto.cm` / `Admin@2026`
5. Tester une commande invité
6. Vérifier les emails (si Gmail configuré)

### 4.2 Problèmes courants

| Problème | Solution |
|----------|----------|
| **"CORS bloqué"** | Vérifier `CORS_ORIGIN` sur Render = URL exacte du frontend (sans `/` à la fin) |
| **API lente (30s)** | Normal sur Render Free : le service se réveille. Patience au premier chargement |
| **"Database disconnected"** | Vérifier `DATABASE_URL` sur Render. S'assurer que l'URL Neon est correcte et que le projet Neon est actif |
| **Images non chargées** | Les uploads locaux ne persistent pas sur Render Free. Voir section "Uploads" ci-dessous |
| **Emails non envoyés** | Vérifier le mot de passe d'application Gmail et que "Accès moins sécurisé" est autorisé |

### 4.3 Note sur les uploads (images produits)
Le plan gratuit de Render **ne conserve pas les fichiers uploadés** entre les redéploiements (système de fichiers éphémère). Options :
- **Court terme** : Ajouter les images de base dans le repo Git (dossier `public/uploads/`)
- **Long terme** : Utiliser un service de stockage cloud gratuit comme **Cloudinary** (plan gratuit = 25 Go) pour stocker les images

---

## Résumé des URLs finales

| Service | URL |
|---------|-----|
| **Frontend** | `https://carsvision-frontend.vercel.app` |
| **API Backend** | `https://carsvision-api.onrender.com` |
| **Health Check** | `https://carsvision-api.onrender.com/api/health` |
| **Dashboard Neon** | `https://console.neon.tech` |

---

## Commandes utiles

```bash
# Générer des secrets JWT sécurisés
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Exécuter des migrations sur la DB de production (depuis local)
$env:DATABASE_URL="votre_url_neon"; $env:NODE_ENV="production"; npx sequelize-cli db:migrate

# Exécuter les seeds sur la DB de production (depuis local)
$env:DATABASE_URL="votre_url_neon"; $env:NODE_ENV="production"; npx sequelize-cli db:seed:all
```
