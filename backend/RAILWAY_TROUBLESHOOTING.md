# 🚨 Dépannage Railway - Erreur "pip: command not found"

## Cause du problème
Railway utilise parfois des images qui n'ont pas Python/pip préinstallé ou mal configuré.

## ✅ Solutions (dans l'ordre de priorité)

### 1. **Utiliser le Dockerfile** (Recommandé)
- Le fichier `Dockerfile` a été créé dans `/backend`
- Railway détectera automatiquement et utilisera Docker
- Plus de contrôle sur l'environnement

### 2. **Configuration avec nixpacks.toml**
- Fichier `nixpacks.toml` créé pour forcer Python 3.11
- Spécifie explicitement les dépendances système

### 3. **Variables d'environnement Railway**
Dans les Settings de votre service Railway, ajouter :
```
PYTHONPATH=/app
PYTHON_VERSION=3.11.0
```

### 4. **Commandes Build/Start manuelles**
Dans Railway Settings :
- **Build Command :** `python3 -m pip install -r requirements.txt`
- **Start Command :** `python3 -m uvicorn server:app --host 0.0.0.0 --port $PORT`

### 5. **Root Directory**
Assurez-vous que le Root Directory est bien défini sur `/backend`

## 🔍 Diagnostic

Si le problème persiste, vérifiez dans les logs Railway :
1. Quelle image Docker/buildpack est utilisée
2. Si Python est bien détecté
3. La version de Python installée

## 🆘 Alternative : Render

Si Railway continue à poser problème, Render est plus stable :
1. Créer un compte sur render.com
2. "New Web Service" → GitHub
3. Utiliser ces paramètres :
   - **Build Command :** `pip install -r requirements.txt`
   - **Start Command :** `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Environment :** Python 3

## 📞 Support
En cas de blocage, consulter la documentation Railway ou ouvrir un ticket support.
