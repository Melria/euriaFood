#!/bin/bash

echo "🔍 Diagnostic des erreurs 401..."

# Vérifier les URLs
echo "Frontend URL: https://emergent-prieh7zyl-melrias-projects.vercel.app"
echo "Quelle est votre URL backend ?"

# Test CORS
echo "🌐 Test CORS..."
curl -H "Origin: https://emergent-prieh7zyl-melrias-projects.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://VOTRE-BACKEND-URL/auth/login

# Test API Health
echo "🏥 Test API Health..."
curl https://VOTRE-BACKEND-URL/docs

echo "📋 Checklist:"
echo "1. ✅ CORS_ORIGINS sur backend = https://emergent-prieh7zyl-melrias-projects.vercel.app"
echo "2. ✅ REACT_APP_BACKEND_URL sur Vercel = https://votre-backend-url"
echo "3. ✅ Backend accessible sur /docs"
echo "4. ✅ Variables d'environnement redéployées"
