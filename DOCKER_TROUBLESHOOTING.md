# 🐳 Guide de dépannage Docker

## 🔍 Problèmes courants et solutions

### 1. "docker: command not found"
```bash
# Installer Docker Desktop (Windows/Mac)
# Ou Docker Engine (Linux)
# Redémarrer le terminal après installation
```

### 2. Erreur de permissions
```bash
# Windows : Lancer Docker Desktop en tant qu'administrateur
# Linux : Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
```

### 3. Build qui échoue
```bash
# Vérifier les logs
docker build -t test . --no-cache

# Debugger en mode interactif
docker run -it python:3.11-slim /bin/bash
```

### 4. L'API ne démarre pas
```bash
# Vérifier les logs du conteneur
docker logs <container_id>

# Tester en mode debug
docker run -it -p 8000:8000 euria-backend
```

### 5. Variables d'environnement manquantes
```bash
# Tester avec variables d'environnement
docker run -e DATABASE_URL="test" -p 8000:8000 euria-backend
```

## 🧪 Commandes de test

```bash
# Build sans cache
docker build --no-cache -t euria-backend .

# Run avec logs
docker run --rm -p 8001:8000 euria-backend

# Vérifier l'image
docker inspect euria-backend

# Entrer dans le conteneur
docker exec -it <container_id> /bin/bash
```

## 📊 Optimisations

### Réduire la taille de l'image
- Utiliser des images `alpine` ou `slim`
- Multi-stage builds
- Nettoyer les caches

### Accélérer les builds
- Utiliser le cache Docker
- Ordonner les COPY intelligemment
- `.dockerignore` complet

### Sécurité
- Utilisateur non-root
- Scan de sécurité : `docker scout cves`
- Variables d'environnement sécurisées
