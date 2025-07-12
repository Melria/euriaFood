# 🚨 Résolution Erreur 401 - Emergent App

## 📋 Configuration actuelle détectée
- **Frontend**: https://emergent-prieh7zyl-melrias-projects.vercel.app
- **Backend**: https://emergent-app-2i83.onrender.com

## ✅ Actions à faire IMMÉDIATEMENT

### 1. Sur Render.com (Backend)
1. Allez sur https://render.com/dashboard
2. Cliquez sur votre service **emergent-app-2i83**
3. Onglet **Environment**
4. Ajoutez/Modifiez ces variables :

```bash
CORS_ORIGINS=https://emergent-prieh7zyl-melrias-projects.vercel.app
DATABASE_URL=mongodb+srv://[votre-url-mongodb]
JWT_SECRET=super-secret-key-minimum-32-characters-long
```

5. Cliquez **Save Changes**
6. Attendez le **redéploiement automatique** (2-3 minutes)

### 2. Sur Vercel (Frontend)
1. Allez sur https://vercel.com/dashboard
2. Cliquez sur votre projet **emergent-prieh7zyl**
3. Settings → **Environment Variables**
4. Ajoutez :

```bash
Name: REACT_APP_BACKEND_URL
Value: https://emergent-app-2i83.onrender.com
```

5. Cliquez **Save**
6. Redéployez : **Deployments** → cliquez sur le dernier → **Redeploy**

## 🧪 Tests de vérification

### Test 1: API accessible
```bash
curl https://emergent-app-2i83.onrender.com/docs
```
✅ Doit retourner la page Swagger

### Test 2: CORS configuré
```bash
curl -H "Origin: https://emergent-prieh7zyl-melrias-projects.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://emergent-app-2i83.onrender.com/auth/login
```
✅ Doit retourner headers CORS

### Test 3: Santé de l'API
```bash
curl https://emergent-app-2i83.onrender.com/health
```

## 🐛 Diagnostic avancé

### Vérifier les logs Render
1. Dashboard Render → votre service
2. Onglet **Logs**
3. Rechercher erreurs CORS ou 401

### Vérifier les logs Vercel
1. Dashboard Vercel → votre projet
2. **View Function Logs**
3. Rechercher erreurs de connexion backend

## 🔄 Si ça ne marche toujours pas

### Option A: Variables d'environnement manquantes
Vérifiez que toutes ces variables sont définies sur Render :
- `DATABASE_URL`
- `JWT_SECRET` 
- `CORS_ORIGINS`

### Option B: Redéploiement complet
1. Sur Render : **Manual Deploy** → **Deploy latest commit**
2. Sur Vercel : **Redeploy** le dernier déploiement

### Option C: Tester en local d'abord
```bash
# Dans backend/
export CORS_ORIGINS=https://emergent-prieh7zyl-melrias-projects.vercel.app
export DATABASE_URL=your-mongodb-url
export JWT_SECRET=your-secret
python -m uvicorn server:app --reload
```

## 📞 Checklist finale
- [ ] Variables Render configurées
- [ ] Variable Vercel configurée  
- [ ] Les deux services redéployés
- [ ] Tests API passent
- [ ] Login fonctionne

## 🆘 Si le problème persiste
Envoyez-moi :
1. Screenshot des variables Render
2. Screenshot des variables Vercel
3. Logs d'erreur des deux plateformes
