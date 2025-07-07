# 🍽️ Documentation Développeur - Application de Gestion de Restaurant

## Vue d'ensemble

Cette application est un système complet de gestion de restaurant avec interface client et interface administrateur. Elle permet la gestion des menus, commandes, réservations et clients avec authentification sécurisée.

## 🏗️ Architecture

### Stack Technologique
- **Backend**: FastAPI (Python) avec authentification JWT
- **Frontend**: React 18 avec Tailwind CSS
- **Base de données**: MongoDB
- **Authentification**: JWT + bcrypt pour le hashing des mots de passe

### Structure du Projet
```
/app/
├── backend/
│   ├── server.py              # API FastAPI principale
│   ├── requirements.txt       # Dépendances Python
│   └── .env                  # Variables d'environnement
├── frontend/
│   ├── src/
│   │   ├── App.js            # Composant React principal
│   │   ├── App.css           # Styles Tailwind + custom
│   │   └── index.js          # Point d'entrée React
│   ├── package.json          # Dépendances Node.js
│   └── .env                  # Variables d'environnement frontend
└── README_DEV.md             # Cette documentation
```

## 🚀 Installation et Configuration

### Prérequis
- Python 3.11+
- Node.js 18+
- MongoDB (local ou distant)
- Yarn (package manager)

### Installation Locale

1. **Cloner le projet**
```bash
git clone <repository-url>
cd restaurant-app
```

2. **Configuration Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

3. **Configuration Frontend**
```bash
cd frontend
yarn install
```

4. **Variables d'environnement**

Backend (`.env`):
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="restaurant_db"
```

Frontend (`.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

5. **Démarrage des services**

Terminal 1 - Backend:
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Terminal 2 - Frontend:
```bash
cd frontend
yarn start
```

L'application sera accessible sur `http://localhost:3000`

## 🔑 Authentification

### Système d'authentification
- **JWT Tokens** pour l'authentification
- **Bcrypt** pour le hashing des mots de passe
- **Rôles utilisateur**: `admin`, `client`, `staff`

### Comptes par défaut
- **Admin**: `admin@restaurant.com` / `admin123`

### Protection des routes
Les routes API sont protégées par middleware JWT. Ajouter le header:
```
Authorization: Bearer <jwt_token>
```

## 📊 API Documentation

### Endpoints d'authentification

#### POST /api/auth/register
Inscription d'un nouvel utilisateur
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "client"
}
```

#### POST /api/auth/login
Connexion utilisateur
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Retourne:
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

### Endpoints Menu

#### GET /api/menu
Récupérer tous les articles du menu
```json
[
  {
    "id": "uuid",
    "name": "Burger Classic",
    "description": "Burger artisanal...",
    "price": 12.90,
    "category": "Plats",
    "image_url": "https://...",
    "available": true,
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### POST /api/menu (Admin seulement)
Ajouter un article au menu
```json
{
  "name": "Nouveau Plat",
  "description": "Description du plat",
  "price": 15.50,
  "category": "Plats",
  "image_url": "https://...",
  "available": true
}
```

#### GET /api/menu/categories
Récupérer les catégories du menu
```json
{
  "categories": ["Entrées", "Plats", "Desserts", "Boissons"]
}
```

### Endpoints Commandes

#### POST /api/orders
Créer une nouvelle commande
```json
{
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "price": 12.90
    }
  ],
  "total": 25.80
}
```

#### GET /api/orders
Récupérer les commandes
- **Client**: Ses propres commandes
- **Admin**: Toutes les commandes

#### GET /api/orders/{order_id}
Récupérer une commande spécifique

#### PUT /api/orders/{order_id}/status (Admin seulement)
Mettre à jour le statut d'une commande
```
?status=confirmed|preparing|ready|delivered
```

### Endpoints Tables

#### GET /api/tables
Récupérer toutes les tables

#### POST /api/tables (Admin seulement)
Créer une nouvelle table
```json
{
  "id": "uuid",
  "number": 5,
  "seats": 4,
  "status": "available"
}
```

### Endpoints Réservations

#### POST /api/reservations
Créer une réservation
```json
{
  "table_id": "uuid",
  "date": "2024-01-01T20:00:00",
  "guests": 4
}
```

#### GET /api/reservations
Récupérer les réservations
- **Client**: Ses propres réservations
- **Admin**: Toutes les réservations

### Endpoints Statistiques

#### GET /api/stats/dashboard (Admin seulement)
Statistiques du tableau de bord
```json
{
  "total_orders": 150,
  "total_users": 45,
  "total_revenue": 2500.50,
  "today_orders": 12
}
```

## 🎨 Interface Utilisateur

### Interface Client
- **Menu**: Navigation par catégories avec filtres
- **Panier**: Gestion des articles avec quantités
- **Commandes**: Historique et suivi des commandes
- **Réservations**: Création et gestion des réservations

### Interface Admin
- **Dashboard**: Statistiques en temps réel
- **Gestion des commandes**: Suivi et mise à jour des statuts
- **Gestion du menu**: Consultation des articles
- **Gestion des réservations**: Vue d'ensemble des réservations

## 🗄️ Modèles de Données

### User
```python
{
  "id": str,
  "email": str,
  "password_hash": str,
  "name": str,
  "role": str,  # "admin", "client", "staff"
  "created_at": datetime
}
```

### MenuItem
```python
{
  "id": str,
  "name": str,
  "description": str,
  "price": float,
  "category": str,
  "image_url": str,
  "available": bool,
  "created_at": datetime
}
```

### Order
```python
{
  "id": str,
  "user_id": str,
  "items": List[OrderItem],
  "total": float,
  "status": str,  # "pending", "confirmed", "preparing", "ready", "delivered"
  "created_at": datetime
}
```

### OrderItem
```python
{
  "menu_item_id": str,
  "quantity": int,
  "price": float
}
```

### Table
```python
{
  "id": str,
  "number": int,
  "seats": int,
  "status": str  # "available", "occupied", "reserved"
}
```

### Reservation
```python
{
  "id": str,
  "user_id": str,
  "table_id": str,
  "date": datetime,
  "guests": int,
  "status": str,  # "pending", "confirmed", "cancelled"
  "created_at": datetime
}
```

## 🔧 Fonctionnalités Avancées

### Gestion des États
L'application utilise React Context pour:
- Authentification globale
- Gestion du panier
- État des commandes

### Sécurité
- Hashing des mots de passe avec bcrypt
- Validation des tokens JWT
- Protection CORS
- Validation des entrées avec Pydantic

### Responsive Design
Interface adaptée pour:
- Desktop
- Tablette
- Mobile

## 🧪 Tests et Développement

### Tests Backend
```bash
cd backend
pytest
```

### Tests Frontend
```bash
cd frontend
yarn test
```

### Mode Développement
- Hot reload activé pour les deux services
- Logs détaillés en mode debug
- CORS permissif pour le développement

## 🚀 Déploiement Production

### Variables d'environnement Production
```env
# Backend
MONGO_URL="mongodb://prod-server:27017"
DB_NAME="restaurant_prod"
SECRET_KEY="your-production-secret-key"

# Frontend
REACT_APP_BACKEND_URL=https://api.votredomaine.com
```

### Build Production
```bash
# Frontend
cd frontend
yarn build

# Backend
cd backend
pip install gunicorn
gunicorn server:app --host 0.0.0.0 --port 8001
```

## 📈 Extensions Possibles

### Fonctionnalités additionnelles
- Système de paiement (Stripe, PayPal)
- Notifications en temps réel (WebSocket)
- Système de fidélité
- Analytics avancés
- API mobile
- Gestion du stock
- Système de notation/avis

### Intégrations tierces
- Services de livraison
- Systèmes de caisse
- Outils de marketing
- Systèmes de comptabilité

## 🐛 Dépannage

### Problèmes courants

#### Backend ne démarre pas
1. Vérifier MongoDB est en cours d'exécution
2. Vérifier les variables d'environnement
3. Vérifier les dépendances installées

#### Frontend ne se connecte pas au backend
1. Vérifier `REACT_APP_BACKEND_URL`
2. Vérifier CORS configuration
3. Vérifier le port backend

#### Erreurs d'authentification
1. Vérifier la validité du token JWT
2. Vérifier les headers Authorization
3. Vérifier les rôles utilisateur

### Logs
- Backend: logs FastAPI dans la console
- Frontend: logs React dans la console du navigateur
- MongoDB: logs de connexion

## 🤝 Contribution

### Standards de code
- Python: PEP 8
- JavaScript: ESLint + Prettier
- Commit messages conventionnels

### Workflow
1. Fork du repository
2. Créer une branche feature
3. Tests
4. Pull request avec description détaillée

---

## 📧 Support

Pour toute question technique ou fonctionnelle, consultez cette documentation ou créez une issue dans le repository.

**Version**: 1.0.0  
**Dernière mise à jour**: Mars 2025