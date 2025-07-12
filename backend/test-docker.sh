#!/bin/bash

echo "🐳 Test du build Docker..."

# Nettoyage
docker system prune -f

# Test avec Dockerfile simple d'abord
echo "📦 Test avec Dockerfile simple..."
docker build -f Dockerfile.simple -t test-simple .

if [ $? -eq 0 ]; then
    echo "✅ Build simple réussi!"
    
    # Test du container
    echo "🚀 Test du container..."
    docker run -d -p 8080:8000 --name test-container test-simple
    
    # Attendre le démarrage
    sleep 10
    
    # Test de l'API
    curl -f http://localhost:8080/docs
    
    if [ $? -eq 0 ]; then
        echo "✅ API fonctionne!"
    else
        echo "❌ API ne répond pas"
        docker logs test-container
    fi
    
    # Nettoyage
    docker stop test-container
    docker rm test-container
    
else
    echo "❌ Build simple échoué"
    echo "🔍 Tentative avec requirements simplifiés..."
    
    # Backup du requirements original
    cp requirements.txt requirements-original.txt
    cp requirements-simple.txt requirements.txt
    
    # Nouveau test
    docker build -f Dockerfile.simple -t test-simple-req .
    
    if [ $? -eq 0 ]; then
        echo "✅ Build avec requirements simplifiés réussi!"
    else
        echo "❌ Échec total - vérifier manuellement"
    fi
    
    # Restaurer l'original
    cp requirements-original.txt requirements.txt
fi
