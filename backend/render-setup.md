# Render.com - Web Service Configuration
# Copiez ces paramètres lors de la création du service

Build Command: docker build -t app .
Start Command: python3 -m uvicorn server:app --host 0.0.0.0 --port $PORT

# Variables d'environnement à ajouter :
# DATABASE_URL=mongodb+srv://...
# JWT_SECRET=votre_secret_jwt_fort
# CORS_ORIGINS=https://votre-app.vercel.app
# PORT=10000

# Auto-Deploy: Yes (connecté à GitHub)
# Branch: main
# Root Directory: backend
