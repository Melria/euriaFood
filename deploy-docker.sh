#!/bin/bash

# Script de déploiement Docker pour Railway/Render

echo "🐳 Construction de l'image Docker..."

# Aller dans le dossier backend
cd backend

# Construire l'image Docker
docker build -t euria-food-backend .

# Tester l'image localement (optionnel)
echo "🧪 Test de l'image..."
docker run -d -p 8000:8000 --name euria-test euria-food-backend

# Attendre quelques secondes
sleep 5

# Tester si l'API répond
curl -f http://localhost:8000/docs || {
    echo "❌ L'API ne répond pas"
    docker logs euria-test
    docker stop euria-test
    docker rm euria-test
    exit 1
}

echo "✅ Test réussi!"

# Nettoyer
docker stop euria-test
docker rm euria-test

echo "🚀 Image prête pour le déploiement!"
echo "📋 Pour déployer sur Railway:"
echo "   1. Poussez le code sur GitHub"
echo "   2. Railway détectera automatiquement le Dockerfile"
echo "   3. Configurez les variables d'environnement"
