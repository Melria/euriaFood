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
pip install stripe>=5.0.0
pip install reportlab>=4.0.0
```

#### Configuration Variables d'Environnement Backend

⚠️ **SÉCURITÉ IMPORTANTE**: Ne jamais committer vos clés API dans Git!

**Méthode 1: Fichier .env local (Développement)**
Créer `/backend/.env` (déjà dans .gitignore):
```env
# Base de données
MONGO_URL="mongodb://localhost:27017"
DB_NAME="restaurant_ai_db"

# IA (OBLIGATOIRE pour fonctionnalités intelligentes)
OPENAI_API_KEY=your_openai_api_key_here

# Sécurité
SECRET_KEY="votre-cle-secrete-tres-complexe-ici"
ALGORITHM="HS256"

# Environnement
ENVIRONMENT="development"
DEBUG=true
```

**Méthode 2: Variables d'environnement système (Recommandé)**
```bash
# Windows PowerShell
$env:OPENAI_API_KEY = "sk-proj-votre-cle-ici"
$env:DATABASE_URL = "mongodb://localhost:27017"

# Windows CMD
set OPENAI_API_KEY=sk-proj-votre-cle-ici
set DATABASE_URL=mongodb://localhost:27017

# Linux/Mac
export OPENAI_API_KEY="sk-proj-votre-cle-ici"
export DATABASE_URL="mongodb://localhost:27017"
```

**Méthode 3: Profil PowerShell permanent (Windows)**
```powershell
# Ouvrir profil PowerShell
notepad $PROFILE

# Ajouter ces lignes:
$env:OPENAI_API_KEY = "sk-proj-votre-cle-ici"
$env:DATABASE_URL = "mongodb://localhost:27017"

# Recharger le profil
. $PROFILE
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

### 5. Configuration Sécurisée des Clés API

#### 🔐 Méthodes Sécurisées pour OpenAI API Key

**⚠️ ATTENTION**: Ne jamais mettre votre clé API directement dans le code!

#### Option 1: Variables d'Environnement Système (Recommandé)

**Windows PowerShell:**
```powershell
# Définir temporairement (session actuelle)
$env:OPENAI_API_KEY = "sk-proj-votre-cle-openai-ici"

# Définir de façon permanente
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-proj-votre-cle-ici", "User")

# Vérifier
echo $env:OPENAI_API_KEY
```

**Windows CMD:**
```cmd
# Définir temporairement
set OPENAI_API_KEY=sk-proj-votre-cle-openai-ici

# Définir de façon permanente
setx OPENAI_API_KEY "sk-proj-votre-cle-openai-ici"
```

**Linux/Mac:**
```bash
# Temporaire (session actuelle)
export OPENAI_API_KEY="sk-proj-votre-cle-openai-ici"

# Permanent (ajouter à ~/.bashrc ou ~/.zshrc)
echo 'export OPENAI_API_KEY="sk-proj-votre-cle-openai-ici"' >> ~/.bashrc
source ~/.bashrc
```

#### Option 2: Fichier .env local avec .gitignore

1. **Créer `.env` dans `/backend/`:**
```env
OPENAI_API_KEY=sk-proj-votre-cle-openai-ici
DATABASE_URL=mongodb://localhost:27017
```

2. **Vérifier que `.env` est dans `.gitignore`:**
```gitignore
# Fichiers de configuration sensibles
.env
.env.local
.env.production
*.env

# Logs
logs/
*.log

# Dependencies
node_modules/
__pycache__/
```

#### Option 3: Azure Key Vault / AWS Secrets Manager (Production)

**Azure Key Vault:**
```python
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://your-vault.vault.azure.net/", credential=credential)

openai_key = client.get_secret("openai-api-key").value
```

**AWS Secrets Manager:**
```python
import boto3

client = boto3.client('secretsmanager', region_name='us-east-1')
response = client.get_secret_value(SecretId='openai-api-key')
openai_key = response['SecretString']
```

#### Option 4: Invite Interactive (Développement)

**Modifier `config.py` pour demander la clé:**
```python
import os
import getpass
from dotenv import load_dotenv

load_dotenv()

def get_openai_api_key():
    """Récupère la clé OpenAI de manière sécurisée"""
    # 1. Essayer variables d'environnement
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if api_key:
        return api_key
    
    # 2. Essayer fichier .env
    if os.path.exists('.env'):
        load_dotenv()
        api_key = os.environ.get('OPENAI_API_KEY')
        if api_key:
            return api_key
    
    # 3. Demander interactivement (développement seulement)
    if os.environ.get('ENVIRONMENT') == 'development':
        print("⚠️  Clé OpenAI non trouvée dans les variables d'environnement")
        api_key = getpass.getpass("Entrez votre clé OpenAI API: ")
        if api_key:
            return api_key
    
    raise ValueError("OPENAI_API_KEY non trouvée. Configurez-la dans les variables d'environnement.")
```

#### 🛡️ Bonnes Pratiques de Sécurité

1. **Ne jamais committer les clés:**
```bash
# Vérifier ce qui va être commité
git status
git diff --cached

# Supprimer fichier déjà commité par accident
git rm --cached .env
git commit -m "Remove .env from tracking"
```

2. **Utiliser des clés différentes par environnement:**
```env
# Développement
OPENAI_API_KEY=sk-proj-dev-key-here

# Production  
OPENAI_API_KEY=sk-proj-prod-key-here
```

3. **Rotation régulière des clés:**
- Changer la clé tous les 3-6 mois
- Utiliser OpenAI Dashboard pour révoquer anciennes clés

4. **Monitoring d'utilisation:**
```python
# Ajouter logging des appels API
logger.info(f"API call made for user: {user_id}")
logger.info(f"Tokens used: {response.usage.total_tokens}")
```

## 🚀 Lancement de l'Application

### Configuration Rapide (Recommandé)

**⚡ Solution Rapide pour Windows:**
```bash
cd backend

# Option 1: Script automatique (plus facile)
set_api_key.bat

# Option 2: PowerShell avancé  
PowerShell -ExecutionPolicy Bypass -File set_api_key.ps1

# Option 3: Script Python interactif
python setup_environment.py
```

**💡 Si vous ne pouvez pas coller votre clé API dans le terminal:**
1. Utilisez un des scripts ci-dessus (recommandé)
2. Ou modifiez directement le fichier `.env`
3. Ou définissez la variable système manuellement

**Script de Configuration Automatique:**
```bash
cd backend

# Lancer le script de configuration
python setup_environment.py

# Le script vous guidera pour:
# 1. Configurer votre clé OpenAI de manière sécurisée
# 2. Choisir la méthode de stockage (système ou .env)
# 3. Valider la configuration
# 4. Configurer .gitignore automatiquement
```

### Démarrage Manuel

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

Paiements:
- stripe>=5.0.0             # Traitement des paiements

Rapports et PDF:
- reportlab>=4.0.0          # Génération de rapports PDF

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

#### Modules Python Manquants

**Symptôme**: `ModuleNotFoundError: No module named 'stripe'`, `'reportlab'`, ou autres modules

**Solutions:**

**1. Réinstaller toutes les dépendances:**
```bash
cd backend

# Activer l'environnement virtuel
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Installer/réinstaller toutes les dépendances
pip install -r requirements.txt

# Ou installer le module manquant spécifiquement
pip install stripe>=5.0.0
pip install reportlab>=4.0.0
```

**2. Vérifier l'environnement virtuel:**
```bash
# Vérifier que l'environnement est activé
which python  # Linux/Mac
where python  # Windows

# Vérifier les modules installés
pip list | grep stripe
pip list | grep reportlab
pip list | grep openai
```

**3. Installer manuellement les modules essentiels:**
```bash
# Modules critiques pour le fonctionnement
pip install stripe>=5.0.0
pip install reportlab>=4.0.0
pip install openai>=1.3.0
pip install fastapi==0.110.1
pip install uvicorn==0.25.0
pip install pymongo==4.5.0
pip install motor==3.3.1
pip install python-dotenv>=1.0.1
```

**4. Recréer l'environnement virtuel si nécessaire:**
```bash
# Supprimer l'ancien environnement
rm -rf venv  # Linux/Mac
rmdir /s venv  # Windows

# Recréer l'environnement
python -m venv venv

# Activer
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Réinstaller tout
pip install -r requirements.txt
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

#### Problème de Copier-Coller dans le Terminal

**Symptôme**: Impossible de coller la clé API quand le backend demande la saisie

**Solutions:**

**1. Utiliser les scripts de configuration:**
```bash
# Windows Batch
cd backend
set_api_key.bat

# Windows PowerShell
cd backend
PowerShell -ExecutionPolicy Bypass -File set_api_key.ps1

# Script Python interactif
python setup_environment.py
```

**2. Méthodes de collage par terminal:**
```bash
# Windows Command Prompt
# - Clic droit pour coller
# - Ou activer: Propriétés > Options > Mode d'édition rapide

# PowerShell
# - Ctrl+Shift+V
# - Ou clic droit
# - Ou Shift+Insert

# Windows Terminal
# - Ctrl+Shift+V
# - Ou clic droit

# Git Bash
# - Shift+Insert
# - Ou clic droit > Paste
```

**3. Définir directement l'environnement (Recommandé):**
```powershell
# PowerShell (méthode permanente)
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-proj-votre-cle-ici", "User")

# Redémarrer le terminal et vérifier
echo $env:OPENAI_API_KEY
```

**4. Modification directe du fichier .env:**
```bash
# Ouvrir .env avec un éditeur
notepad backend\.env

# Remplacer la ligne:
OPENAI_API_KEY=your_openai_api_key_here
# Par:
OPENAI_API_KEY=sk-proj-votre-cle-reelle-ici
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