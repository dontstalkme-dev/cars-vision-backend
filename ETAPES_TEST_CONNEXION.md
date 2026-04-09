# 🚀 Étapes pour Tester la Connexion Admin

## ✅ Ce qui a été vérifié

Le script `test-connexion-admin.js` a confirmé que :
- ✅ Le compte admin existe
- ✅ Le mot de passe est correct
- ✅ Le compte est actif
- ✅ Le backend fonctionne

## 🎯 Maintenant, testez la connexion

### Étape 1: Démarrer le Backend (si pas déjà fait)

```bash
cd Car_Vision
npm run dev
```

**Vous devriez voir** :
```
✓ Connexion a la base de donnees reussie
✓ Base de donnees synchronisee
✓ Serveur demarre sur le port 5000
✓ Environment: development
```

### Étape 2: Tester avec le fichier HTML

1. **Ouvrez** `Car_Vision_Frontend/test-login.html` dans votre navigateur
2. **Le formulaire est pré-rempli** avec les identifiants admin
3. **Cliquez** sur "Se connecter"
4. **Regardez** les logs détaillés qui s'affichent

**Résultat attendu** :
- ✅ Message "Connexion réussie!"
- ✅ Token JWT affiché
- ✅ Informations utilisateur affichées

### Étape 3: Tester avec l'Application React

1. **Démarrez le frontend** (dans un nouveau terminal) :
   ```bash
   cd Car_Vision_Frontend
   npm run dev
   ```

2. **Ouvrez** http://localhost:5173/login

3. **Entrez les identifiants** :
   - Email: `admin@carsvisionauto.cm`
   - Mot de passe: `Admin@2026`

4. **Ouvrez la console** (F12) pour voir les logs

5. **Cliquez** sur "Se connecter"

**Résultat attendu** :
- ✅ Logs dans la console : "🔐 Tentative de connexion..."
- ✅ Logs : "✅ Connexion réussie"
- ✅ Redirection vers `/admin/dashboard`

## 🔍 Que Faire Si Ça Ne Marche Pas

### Scénario 1: "Backend non accessible"

**Problème** : Le frontend ne peut pas joindre le backend

**Solutions** :
1. Vérifiez que le backend tourne sur http://localhost:5000
2. Vérifiez le fichier `.env` du frontend :
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Redémarrez le frontend après modification du .env

### Scénario 2: "Email et mot de passe requis"

**Problème** : Le backend ne reçoit pas les données

**Solutions** :
1. Ouvrez la console (F12) → Network
2. Cliquez sur la requête `/api/auth/login`
3. Vérifiez le "Request Payload" :
   ```json
   {
     "email": "admin@carsvisionauto.cm",
     "mot_de_passe": "Admin@2026"
   }
   ```
4. Si `password` apparaît au lieu de `mot_de_passe`, le fichier LoginPage.jsx n'a pas été mis à jour

### Scénario 3: "Email ou mot de passe incorrect"

**Problème** : Les identifiants ne correspondent pas

**Solutions** :
1. Vérifiez l'orthographe exacte :
   - Email: `admin@carsvisionauto.cm` (pas .com)
   - Mot de passe: `Admin@2026` (A majuscule, @ symbole)
2. Exécutez le script de test :
   ```bash
   cd Car_Vision
   node test-connexion-admin.js
   ```
3. Si le script échoue, réexécutez les seeders :
   ```bash
   npx sequelize-cli db:seed:undo:all
   npx sequelize-cli db:seed:all
   ```

### Scénario 4: "Compte bloqué"

**Problème** : Trop de tentatives échouées

**Solution** :
```sql
-- Dans psql
UPDATE utilisateurs 
SET statut = 'actif', tentatives_connexion = 0 
WHERE email = 'admin@carsvisionauto.cm';
```

## 📝 Checklist de Vérification

Avant de tester, assurez-vous que :

- [ ] PostgreSQL est démarré
- [ ] La base de données `carsvisionauto` existe
- [ ] Les migrations ont été exécutées : `npx sequelize-cli db:migrate`
- [ ] Les seeders ont été exécutés : `npx sequelize-cli db:seed:all`
- [ ] Le backend est démarré : `npm run dev` dans Car_Vision
- [ ] Le frontend est démarré : `npm run dev` dans Car_Vision_Frontend
- [ ] Le fichier `.env` du frontend contient : `VITE_API_URL=http://localhost:5000/api`

## 🎯 Résultat Attendu

Après connexion réussie :

1. **Dans la console** :
   ```
   🔐 Tentative de connexion avec: {email: "admin@carsvisionauto.cm"}
   ✅ Connexion réussie: {token: "...", utilisateur: {...}}
   ```

2. **Dans l'interface** :
   - Redirection automatique vers `/admin/dashboard`
   - Affichage du dashboard admin
   - Menu admin visible

3. **Dans localStorage** :
   - `token` : JWT access token
   - `refreshToken` : JWT refresh token
   - `user` : Informations utilisateur

## 🔗 Fichiers Utiles

1. **test-connexion-admin.js** - Vérifie que l'admin existe (✅ Testé)
2. **test-login.html** - Test standalone de la connexion
3. **LoginPage.jsx** - Page de connexion corrigée
4. **RESOLUTION_CONNEXION_ADMIN.md** - Ce guide

## 💡 Commandes Rapides

```bash
# Vérifier que l'admin existe
cd Car_Vision
node test-connexion-admin.js

# Réexécuter les seeders si nécessaire
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all

# Démarrer le backend
npm run dev

# Démarrer le frontend (nouveau terminal)
cd Car_Vision_Frontend
npm run dev

# Tester la connexion avec curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carsvisionauto.cm","mot_de_passe":"Admin@2026"}'
```

## 🎉 Prochaines Étapes

Une fois la connexion fonctionnelle :

1. ✅ Tester le dashboard admin
2. ✅ Ajouter des produits
3. ✅ Créer des catégories
4. ✅ Gérer les zones de livraison
5. ✅ Tester les commandes
6. ✅ Tester les rendez-vous

---

**Statut Actuel** : Backend vérifié ✅ | Prêt pour les tests frontend ⏳
