# 🚀 Guide de Déploiement EURIA Food

## Option 1 : Vercel + Railway (Recommandé)

### Étape 1 : Préparer MongoDB
1. Créer un compte MongoDB Atlas (gratuit)
2. Créer un cluster M0 (gratuit)
3. Configurer l'accès réseau (0.0.0.0/0)
4. Créer un utilisateur de base de données
5. Récupérer l'URL de connexion

### Étape 2 : Déployer le Backend sur Railway
1. Aller sur https://railway.app/
2. Se connecter avec GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Sélectionner votre repository
5. **IMPORTANT : Choisir le dossier `backend` comme Root Directory**
6. Dans les Settings du service :
   - Root Directory : `/backend`
   - Build Command : `pip install -r requirements.txt`
   - Start Command : `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`
7. Ajouter les variables d'environnement :
   ```
   DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/restaurant_db
   DB_NAME=restaurant_db
   JWT_SECRET=votre-secret-tres-long-et-complexe
   CORS_ORIGINS=https://votre-frontend.vercel.app
   PYTHONPATH=/app
   ```

### Étape 3 : Déployer le Frontend sur Vercel
1. Installer Vercel CLI : `npm i -g vercel`
2. Dans le dossier frontend : `vercel`
3. Suivre les instructions
4. Configurer la variable d'environnement :
   ```
   REACT_APP_BACKEND_URL=https://votre-backend.railway.app
   ```

## Option 2 : Render (Tout en un)

### Étape 1 : Configuration
1. Aller sur https://render.com/
2. Se connecter avec GitHub
3. "New" → "Blueprint"
4. Utiliser le fichier `render.yaml` fourni

### Étape 2 : Variables d'environnement
Configurer dans l'interface Render :
```
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/restaurant_db
DB_NAME=restaurant_db
JWT_SECRET=votre-secret-tres-long-et-complexe
```

## Option 3 : DigitalOcean App Platform

### Étape 1 : Configuration
1. Aller sur https://cloud.digitalocean.com/apps
2. "Create App" → "GitHub"
3. Sélectionner votre repository
4. Utiliser le fichier `.do/app.yaml`

## 🔒 Sécurité en Production

### 1. Variables d'environnement obligatoires
- `JWT_SECRET` : Clé secrète très complexe (min 32 caractères)
- `DATABASE_URL` : URL sécurisée MongoDB
- `CORS_ORIGINS` : Limiter aux domaines autorisés

### 2. HTTPS
Tous les hébergeurs recommandés fournissent HTTPS automatiquement

### 3. Monitoring
- Configurer les logs d'erreur
- Surveiller les performances
- Alertes en cas de problème

## 💰 Coûts estimés

### Gratuit (pour débuter)
- Frontend : Vercel (gratuit)
- Backend : Railway (500h/mois gratuit)
- Base de données : MongoDB Atlas M0 (gratuit)

### Production (trafic moyen)
- Frontend : Vercel Pro (~20€/mois)
- Backend : Railway Pro (~20€/mois)
- Base de données : MongoDB Atlas M2 (~9€/mois)
**Total : ~49€/mois**

## 🛠️ Checklist avant déploiement

- [ ] Tester l'application localement
- [ ] Configurer MongoDB Atlas
- [ ] Créer les comptes hébergeur
- [ ] Configurer les variables d'environnement
- [ ] Tester en production
- [ ] Configurer un nom de domaine (optionnel)
- [ ] Mettre en place le monitoring

## 🆘 Dépannage

### Erreur CORS
Vérifier que `CORS_ORIGINS` contient l'URL exacte du frontend

### Erreur de base de données
Vérifier que l'IP 0.0.0.0/0 est autorisée dans MongoDB Atlas

### Erreur 500
Vérifier les logs de l'hébergeur pour identifier le problème

## 📞 Support
En cas de problème, consulter la documentation de votre hébergeur ou ouvrir une issue sur GitHub.
