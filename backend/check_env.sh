#!/bin/bash

# Script de vérification avant déploiement
echo "🔍 Vérification de l'environnement..."

# Vérifier Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3 trouvé: $(python3 --version)"
else
    echo "❌ Python3 non trouvé"
    exit 1
fi

# Vérifier pip
if command -v pip &> /dev/null; then
    echo "✅ pip trouvé: $(pip --version)"
elif command -v pip3 &> /dev/null; then
    echo "✅ pip3 trouvé: $(pip3 --version)"
else
    echo "❌ pip non trouvé"
    exit 1
fi

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."
python3 -m pip install --dry-run -r requirements.txt

echo "✅ Vérification terminée avec succès!"
