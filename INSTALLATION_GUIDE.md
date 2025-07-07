# 🍽️ Guide d'Installation - Application Restaurant Intelligente

## 📋 Vue d'ensemble

Application complète de gestion de restaurant avec fonctionnalités d'Intelligence Artificielle :
- 🤖 Recommandations de menu personnalisées par IA
- 📊 Prédiction intelligente des stocks
- 💰 Optimisation automatique des prix
- 📈 Analytics et insights business avancés
- 👥 Interface client et admin complètes

## ⚙️ Prérequis Système

### Logiciels Requis
- **Python**: 3.11+ (recommandé 3.11)
- **Node.js**: 18+ (recommandé 18.19+)
- **MongoDB**: 7.0+ (local ou Atlas)
- **Git**: 2.40+
- **Yarn**: 1.22+ (gestionnaire de packages)

### Comptes Externes Nécessaires
- **OpenAI API**: Clé API pour fonctionnalités IA (https://platform.openai.com)
- **MongoDB Atlas** (optionnel): Base de données cloud (https://mongodb.com/atlas)

## 📥 Installation Locale

### 1. Clonage du Projet
```bash
git clone <votre-repository-url>
cd restaurant-app
```

### 2. Configuration Backend (Python/FastAPI)

#### Installation Environnement Python
```bash
# Créer environnement virtuel
cd backend
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

#### Installation Dépendances Backend
```bash
# Installer toutes les dépendances
pip install -r requirements.txt

# Ou installation manuelle :
pip install fastapi==0.110.1
pip install uvicorn==0.25.0
pip install motor==3.3.1
pip install pymongo==4.5.0
pip install python-dotenv>=1.0.1
pip install pydantic>=2.6.4
pip install pyjwt>=2.10.1
pip install passlib>=1.7.4
pip install bcrypt>=3.2.0
pip install openai>=1.3.0
pip install scikit-learn>=1.3.0
pip install pandas>=2.2.0
pip install numpy>=1.26.0
pip install python-multipart>=0.0.9
pip install aiofiles>=23.0.0
pip install requests>=2.31.0
pip install cryptography>=42.0.8
pip install email-validator>=2.2.0
pip install tzdata>=2024.2
```

#### Configuration Variables d'Environnement Backend
Créer `/backend/.env`:
```env
# Base de données
MONGO_URL="mongodb://localhost:27017"
DB_NAME="restaurant_ai_db"

# IA (OBLIGATOIRE pour fonctionnalités intelligentes)
OPENAI_API_KEY="sk-proj-VOTRE_CLE_OPENAI_ICI"

# Sécurité
SECRET_KEY="votre-cle-secrete-tres-complexe-ici"
ALGORITHM="HS256"

# Environnement
ENVIRONMENT="development"
DEBUG=true
```

### 3. Configuration Frontend (React)

#### Installation Dépendances Frontend
```bash
cd frontend

# Installer Yarn si pas installé
npm install -g yarn

# Installer dépendances
yarn install

# Ou installation manuelle des principales :
yarn add react@^19.0.0
yarn add react-dom@^19.0.0
yarn add axios@^1.8.4
yarn add react-router-dom@^7.5.1

# Dépendances de développement
yarn add -D @craco/craco@^7.1.0
yarn add -D tailwindcss@^3.4.17
yarn add -D autoprefixer@^10.4.20
yarn add -D postcss@^8.4.49
```

#### Configuration Variables d'Environnement Frontend
Créer `/frontend/.env`:
```env
# URL Backend (changer selon votre configuration)
REACT_APP_BACKEND_URL=http://localhost:8001

# Configuration Développement
WDS_SOCKET_PORT=443
REACT_APP_ENV=development
```

### 4. Configuration Base de Données

#### Option A: MongoDB Local
```bash
# Installation MongoDB (Ubuntu/Debian)
sudo apt-get install -y mongodb

# Installation MongoDB (Mac avec Homebrew)
brew install mongodb/brew/mongodb-community

# Installation MongoDB (Windows)
# Télécharger depuis https://www.mongodb.com/try/download/community

# Démarrer MongoDB
sudo systemctl start mongodb    # Linux
brew services start mongodb     # Mac
# Windows: Démarrer via Services
```

#### Option B: MongoDB Atlas (Cloud)
1. Créer compte sur https://mongodb.com/atlas
2. Créer cluster gratuit
3. Récupérer string de connexion
4. Modifier `MONGO_URL` dans `.env`

### 5. Obtention Clé OpenAI

#### Créer Compte OpenAI
1. Aller sur https://platform.openai.com
2. Créer compte et vérifier email
3. Aller dans API Keys
4. Créer nouvelle clé API
5. Copier la clé (format: `sk-proj-...` ou `sk-...`)
6. Ajouter dans `/backend/.env`:
```env
OPENAI_API_KEY="sk-proj-VOTRE_CLE_ICI"
```

⚠️ **Important**: La clé OpenAI est OBLIGATOIRE pour les fonctionnalités IA.

## 🚀 Lancement de l'Application

### Démarrage Backend
```bash
cd backend
source venv/bin/activate  # Activer environnement

# Méthode 1: Uvicorn direct
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Méthode 2: Python direct
python -c "import uvicorn; uvicorn.run('server:app', host='0.0.0.0', port=8001, reload=True)"
```

### Démarrage Frontend
```bash
# Nouveau terminal
cd frontend
yarn start
```

### Accès Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Documentation API**: http://localhost:8001/docs

## 👤 Comptes de Test

### Administrateur
- **Email**: `admin@restaurant.com`
- **Mot de passe**: `admin123`
- **Accès**: Dashboard admin complet + fonctionnalités IA

### Client (à créer)
- S'inscrire via l'interface
- Accès: Menu, commandes, réservations + recommandations IA

## 🧪 Test de l'Installation

### Vérification Backend
```bash
# Test API de base
curl http://localhost:8001/api/menu

# Test authentification
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin123"}'
```

### Vérification Fonctionnalités IA
```bash
# Après connexion admin, tester recommandations IA
curl -X POST http://localhost:8001/api/ai/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_id_here"}'
```

## 📦 Dépendances Détaillées

### Backend Python
```
Core Framework:
- fastapi==0.110.1          # Framework API moderne
- uvicorn==0.25.0           # Serveur ASGI

Base de données:
- motor==3.3.1              # Driver MongoDB async
- pymongo==4.5.0            # Driver MongoDB sync

Authentification:
- pyjwt>=2.10.1             # JSON Web Tokens
- passlib>=1.7.4            # Hashing mots de passe
- bcrypt>=3.2.0             # Algorithme bcrypt

Intelligence Artificielle:
- openai>=1.3.0             # API OpenAI GPT
- scikit-learn>=1.3.0       # Machine Learning
- pandas>=2.2.0             # Manipulation données
- numpy>=1.26.0             # Calculs numériques

Utilitaires:
- python-dotenv>=1.0.1      # Variables environnement
- pydantic>=2.6.4           # Validation données
- aiofiles>=23.0.0          # Fichiers asynchrones
- requests>=2.31.0          # Requêtes HTTP
```

### Frontend React
```
Core:
- react@^19.0.0             # Framework UI
- react-dom@^19.0.0         # DOM React
- react-scripts@5.0.1       # Scripts build

Routing & API:
- react-router-dom@^7.5.1   # Navigation
- axios@^1.8.4              # Requêtes HTTP

Styling:
- tailwindcss@^3.4.17       # Framework CSS
- autoprefixer@^10.4.20     # Préfixes CSS
- postcss@^8.4.49           # Processeur CSS

Build:
- @craco/craco@^7.1.0       # Configuration build
```

## 🔧 Configuration Avancée

### Variables d'Environnement Complètes

#### Backend (.env)
```env
# Base de données
MONGO_URL="mongodb://localhost:27017"
DB_NAME="restaurant_ai_db"

# IA et APIs externes
OPENAI_API_KEY="sk-proj-votre-cle"
OPENAI_MODEL="gpt-4"
OPENAI_MAX_TOKENS=1000

# Sécurité
SECRET_KEY="cle-secrete-production-très-longue"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuration serveur
HOST="0.0.0.0"
PORT=8001
WORKERS=1

# Logging
LOG_LEVEL="INFO"
LOG_FILE="logs/app.log"

# CORS (développement)
CORS_ORIGINS='["http://localhost:3000"]'

# Fonctionnalités
ENABLE_AI_FEATURES=true
ENABLE_RECOMMENDATIONS=true
ENABLE_INVENTORY_PREDICTION=true
ENABLE_PRICE_OPTIMIZATION=true
```

#### Frontend (.env)
```env
# Backend API
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_API_TIMEOUT=30000

# Fonctionnalités UI
REACT_APP_ENABLE_AI_FEATURES=true
REACT_APP_ENABLE_DARK_MODE=true
REACT_APP_PAGINATION_SIZE=20

# Développement
REACT_APP_ENV=development
REACT_APP_DEBUG=true
WDS_SOCKET_PORT=443

# Analytics (optionnel)
REACT_APP_GOOGLE_ANALYTICS=""
```

## 🐳 Déploiement Docker (Optionnel)

### Dockerfile Backend
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Dockerfile Frontend
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## ❌ Dépannage

### Problèmes Fréquents

#### Backend ne démarre pas
```bash
# Vérifier Python et dépendances
python --version
pip list

# Vérifier MongoDB
mongo --eval "db.stats()"

# Logs détaillés
uvicorn server:app --log-level debug
```

#### Frontend ne se connecte pas
```bash
# Vérifier URL backend
echo $REACT_APP_BACKEND_URL

# Vérifier CORS
curl -H "Origin: http://localhost:3000" http://localhost:8001/api/menu
```

#### Fonctionnalités IA ne marchent pas
```bash
# Vérifier clé OpenAI
echo $OPENAI_API_KEY

# Test API OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Logs et Monitoring
```bash
# Logs backend
tail -f logs/app.log

# Logs MongoDB
tail -f /var/log/mongodb/mongod.log

# Logs système
journalctl -u mongodb
```

## 📞 Support

### Documentation
- **API**: http://localhost:8001/docs
- **Code**: Commentaires inline
- **Architecture**: README_DEV.md

### Contact
Pour assistance technique, vérifiez :
1. Les logs d'erreur
2. Les variables d'environnement
3. Les dépendances installées
4. La connectivité réseau

---

**Version**: 2.0.0 avec IA  
**Dernière mise à jour**: Mars 2025  
**Compatibilité**: Python 3.11+, Node.js 18+, MongoDB 7+