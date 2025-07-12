# Google Cloud Run - Très rapide et fiable
# 1. Installer Google Cloud CLI
# 2. Authentification: gcloud auth login
# 3. Créer projet: gcloud projects create emergent-backend
# 4. Activer Cloud Run: gcloud services enable run.googleapis.com

# Déploiement depuis le dossier backend :
gcloud run deploy emergent-backend \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=votre_mongodb,JWT_SECRET=votre_secret,CORS_ORIGINS=https://votre-frontend.vercel.app"

# Avantages:
# - Dockerfile automatiquement détecté ✅
# - Scaling automatique ✅  
# - Plan gratuit généreux ✅
# - Très rapide ✅
