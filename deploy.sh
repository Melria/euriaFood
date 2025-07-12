#!/bin/bash

# Script de déploiement automatique
echo "🚀 Déploiement de EURIA Food..."

# 1. Vérifier les dépendances
echo "📦 Vérification des dépendances..."
cd backend && pip freeze > requirements.txt
cd ../frontend && npm audit fix

# 2. Build du frontend
echo "🏗️ Build du frontend..."
npm run build

# 3. Tests
echo "🧪 Exécution des tests..."
# Ajouter vos tests ici

# 4. Déploiement
echo "☁️ Déploiement en cours..."
# Vercel (frontend)
cd frontend && vercel --prod

# Railway/Render (backend)
echo "✅ Déploiement terminé!"
