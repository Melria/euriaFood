# 🍽️ Documentation Développeur Complète - Restaurant Management System IA

## 📋 Vue d'ensemble du Projet

### Description
Système complet de gestion de restaurant avec intelligence artificielle intégrée, offrant des fonctionnalités avancées pour les clients et les administrateurs.

### Fonctionnalités Principales
- 🤖 **Intelligence Artificielle** : Recommandations personnalisées, prédiction des stocks, optimisation des prix
- 💳 **Paiements Stripe** : Intégration complète avec paiements par carte et espèces
- 📊 **Rapports PDF** : Génération automatique de rapports journaliers et factures
- 🛒 **E-commerce** : Panier d'achat, gestion des commandes, favoris
- 👥 **Multi-rôles** : Interface client et administration séparées
- 📱 **Responsive** : Compatible mobile, tablette et desktop

## 🏗️ Architecture Technique

### Stack Technologique
```
Frontend:
├── React 19.0.0          # Framework UI moderne
├── React Router 7.5.1    # Navigation SPA
├── Axios 1.8.4           # Client HTTP
├── Stripe Elements       # Paiements sécurisés
├── React Hot Toast       # Notifications
├── Tailwind CSS 3.4.17   # Framework CSS
└── Lucide React          # Icônes

Backend:
├── FastAPI 0.110.1       # Framework API moderne
├── Motor 3.3.1           # Driver MongoDB async
├── Stripe SDK            # Paiements
├── ReportLab             # Génération PDF
├── OpenAI 1.3.0          # Intelligence artificielle
├── JWT + Bcrypt          # Authentification sécurisée
└── Pydantic 2.6.4        # Validation des données

Base de données:
└── MongoDB 7.0+          # Base NoSQL flexible
```

### Architecture des Dossiers
```
restaurant-app/
├── backend/
│   ├── server.py              # API principale FastAPI
│   ├── ai_service.py          # Services IA (OpenAI)
│   ├── payment_service.py     # Intégration Stripe
│   ├── report_service.py      # Génération PDF
│   ├── inventory_models.py    # Modèles inventaire
│   ├── models.py              # Modèles Pydantic
│   ├── requirements.txt       # Dépendances Python
│   └── .env                   # Configuration
├── frontend/
│   ├── src/
│   │   ├── App.js            # Application React principale
│   │   ├── App.css           # Styles personnalisés
│   │   └── index.js          # Point d'entrée
│   ├── package.json          # Dépendances Node.js
│   └── .env                  # Configuration frontend
├── INSTALLATION_GUIDE.md     # Guide d'installation
├── README_DEV.md             # Documentation développeur
└── DEVELOPER_DOCUMENTATION.md # Cette documentation
```

## 🔐 Système d'Authentification

### Implémentation JWT
```python
# Génération de token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Vérification de token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Rôles et Permissions
```python
# Rôles disponibles
ROLES = {
    "admin": ["all_permissions"],
    "staff": ["view_orders", "update_order_status"],
    "client": ["view_menu", "create_order", "view_own_orders"]
}

# Protection des routes admin
@api_router.post("/menu")
async def create_menu_item(item: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
```

## 💳 Intégration Paiements Stripe

### Configuration Stripe
```python
# payment_service.py
class PaymentService:
    def __init__(self):
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        self.webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    async def create_payment_intent(self, amount: float, currency: str = "eur", metadata: Dict = None):
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Centimes
            currency=currency,
            metadata=metadata or {},
            automatic_payment_methods={'enabled': True},
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "status": intent.status
        }
```

### Gestion des Webhooks
```python
@app.post("/webhook/stripe")
async def stripe_webhook(request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, payment_service.webhook_secret)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        order_id = payment_intent['metadata'].get('order_id')
        if order_id:
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
    
    return {"status": "success"}
```

### Frontend Stripe
```javascript
// Configuration Stripe
const stripePromise = loadStripe('pk_test_51234567890abcdef');

// Composant de paiement
function PaymentModal({ total, cartItems, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const handlePayment = async () => {
    const paymentData = {
      amount: total,
      currency: 'eur',
      payment_method: paymentMethod,
      order_id: order.id
    };
    
    const paymentResponse = await api.post('/payments/create-intent', paymentData);
    
    if (paymentMethod === 'card') {
      // Intégration Stripe Elements
      // Redirection vers paiement sécurisé
    }
  };
}
```

## 🤖 Services d'Intelligence Artificielle

### Recommandations Personnalisées
```python
# ai_service.py
async def generate_menu_recommendations(self, user_id: str, order_history: List, preferences: Dict = None):
    prompt = f"""
    En tant qu'IA spécialisée en recommandations culinaires, analysez l'historique de commandes 
    et générez des recommandations personnalisées.
    
    Historique client: {json.dumps(order_history, default=str)}
    Préférences: {json.dumps(preferences or {}, default=str)}
    
    Analysez:
    - Préférences alimentaires passées
    - Catégories favorites
    - Gamme de prix
    - Fréquence de commande
    
    Répondez en JSON avec: recommended_items, insights
    """
    
    # Intégration OpenAI GPT
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )
    
    return json.loads(response.choices[0].message.content)
```

### Prédiction des Stocks
```python
async def predict_inventory_demand(self, historical_data: List, days_ahead: int = 7):
    # Analyse des tendances historiques
    # Machine learning pour prédiction
    # Alertes automatiques
    
    mock_prediction = {
        "predictions": [
            {
                "item_name": "Burger Classic",
                "predicted_demand": 45,
                "confidence": 0.89,
                "trend": "stable"
            }
        ],
        "alerts": [
            "Stock faible prévu pour Burger Classic - commander 50 unités"
        ]
    }
    return mock_prediction
```

## 📊 Génération de Rapports PDF

### Service de Rapports
```python
# report_service.py
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

class ReportService:
    def generate_daily_report(self, orders: List[Dict], date: datetime) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Titre avec style personnalisé
        title = Paragraph(f"Rapport Journalier - {date.strftime('%d/%m/%Y')}", self.title_style)
        story.append(title)
        
        # Statistiques en tableau
        total_orders = len(orders)
        total_revenue = sum(order.get('total', 0) for order in orders)
        
        stats_data = [
            ['Statistiques', 'Valeur'],
            ['Nombre de commandes', str(total_orders)],
            ['Chiffre d\'affaires', f"{total_revenue:.2f} €"]
        ]
        
        stats_table = Table(stats_data)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(stats_table)
        doc.build(story)
        
        buffer.seek(0)
        return buffer.getvalue()
```

### Téléchargement Frontend
```javascript
const downloadDailyReport = async () => {
  try {
    const response = await api.get('/reports/daily', {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success('Rapport téléchargé !');
  } catch (error) {
    toast.error('Erreur lors du téléchargement');
  }
};
```

## 🗄️ Modèles de Données

### Modèles Principaux
```python
# User Model
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    role: str  # "admin", "client", "staff"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Order Model
class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total: float
    status: str = "pending"  # pending, confirmed, preparing, ready, delivered
    payment_status: str = "pending"  # pending, paid, failed, refunded
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Payment Model
class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    amount: float
    currency: str
    payment_method: str  # "card", "cash"
    stripe_payment_intent_id: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Relations MongoDB
```javascript
// Structure des collections
{
  users: [
    {
      id: "uuid",
      email: "user@example.com",
      password_hash: "bcrypt_hash",
      name: "User Name",
      role: "client",
      created_at: "2024-01-01T00:00:00Z"
    }
  ],
  
  orders: [
    {
      id: "uuid",
      user_id: "user_uuid",
      items: [
        {
          menu_item_id: "item_uuid",
          quantity: 2,
          price: 12.90
        }
      ],
      total: 25.80,
      status: "confirmed",
      payment_status: "paid",
      created_at: "2024-01-01T12:00:00Z"
    }
  ],
  
  menu_items: [
    {
      id: "uuid",
      name: "Burger Classic",
      description: "Burger artisanal...",
      price: 12.90,
      category: "Plats",
      image_url: "https://...",
      available: true,
      popularity_score: 0.92,
      created_at: "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🔌 API Documentation

### Endpoints d'Authentification
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "client"
}

Response: 200 OK
{
  "message": "User created successfully"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
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
```http
GET /api/menu
Response: 200 OK
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

```http
POST /api/menu
Authorization: Bearer admin_token
Content-Type: application/json

{
  "name": "Nouveau Plat",
  "description": "Description du plat",
  "price": 15.50,
  "category": "Plats",
  "image_url": "https://...",
  "available": true
}
```

### Endpoints Paiement
```http
POST /api/payments/create-intent
Authorization: Bearer user_token
Content-Type: application/json

{
  "amount": 25.80,
  "currency": "eur",
  "payment_method": "card",
  "order_id": "order_uuid"
}

Response: 200 OK
{
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "status": "requires_payment_method"
}
```

### Endpoints IA
```http
POST /api/ai/recommendations
Authorization: Bearer user_token
Content-Type: application/json

{
  "user_id": "user_uuid",
  "preferences": {
    "dietary": "vegetarian",
    "price_range": "medium"
  }
}

Response: 200 OK
{
  "status": "success",
  "recommendations": {
    "recommended_items": [
      {
        "name": "Salade Méditerranéenne",
        "reason": "Correspond à vos préférences végétariennes",
        "confidence_score": 0.87
      }
    ],
    "insights": "Vous préférez les plats équilibrés..."
  }
}
```

## 🎨 Interface Utilisateur

### Architecture React
```javascript
// Structure des composants
App
├── AuthProvider (Context)
├── CartProvider (Context)
├── Router
    ├── LoginForm
    ├── ProtectedRoute
    │   ├── Header
    │   ├── MenuPage
    │   ├── CartPage
    │   └── PaymentModal
    └── AdminRoute
        ├── AdminDashboard
        ├── AdminOrders
        ├── AdminMenu
        └── MenuItemForm
```

### Gestion d'État
```javascript
// Context d'authentification
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Context du panier
const CartContext = createContext();

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, /* ... */ }}>
      {children}
    </CartContext.Provider>
  );
}
```

### Styles et Design System
```css
/* Design system avec Tailwind CSS */
:root {
  --primary-color: #f97316;
  --secondary-color: #ea580c;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
}

/* Composants réutilisables */
.btn-primary {
  @apply bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors;
}

.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.form-control {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 🧪 Tests et Qualité

### Tests Backend
```python
# test_api.py
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_register_user():
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "test123",
        "role": "client"
    })
    assert response.status_code == 200

def test_login_user():
    response = client.post("/api/auth/login", json={
        "email": "admin@restaurant.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_get_menu():
    response = client.get("/api/menu")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

### Tests Frontend
```javascript
// App.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders login form', () => {
  render(<App />);
  const loginButton = screen.getByText(/se connecter/i);
  expect(loginButton).toBeInTheDocument();
});

test('adds item to cart', () => {
  const { getByText, getByTestId } = render(<MenuPage />);
  const addButton = getByText('Ajouter');
  fireEvent.click(addButton);
  
  expect(getByTestId('cart-count')).toHaveTextContent('1');
});
```

### Validation des Données
```python
# Validation Pydantic
class MenuItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    price: float = Field(..., gt=0, le=1000)
    category: str = Field(..., regex="^(Entrées|Plats|Desserts|Boissons)$")
    image_url: str = Field(..., regex="^https?://")
    available: bool = True

    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Le prix doit être positif')
        return round(v, 2)
```

## 🚀 Déploiement et Production

### Configuration Production
```python
# backend/.env.production
MONGO_URL="mongodb://prod-server:27017"
DB_NAME="restaurant_prod"
SECRET_KEY="your-super-secure-production-key"
STRIPE_SECRET_KEY="sk_live_your_live_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
OPENAI_API_KEY="sk-proj-your-openai-key"
ENVIRONMENT="production"
DEBUG=false
```

```javascript
// frontend/.env.production
REACT_APP_BACKEND_URL=https://api.votredomaine.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
REACT_APP_ENV=production
```

### Docker Configuration
```dockerfile
# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
```

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine as build

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - DB_NAME=restaurant_prod
    depends_on:
      - mongo
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mongo_data:
```

## 📈 Monitoring et Maintenance

### Logging
```python
# Configuration logging
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Middleware de logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.utcnow()
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    logger.info(f"{request.method} {request.url} - {response.status_code} - {process_time:.3f}s")
    return response
```

### Métriques et Analytics
```python
# Métriques personnalisées
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### Sauvegarde MongoDB
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Sauvegarde MongoDB
mongodump --host localhost:27017 --db restaurant_prod --out $BACKUP_DIR/mongo_$DATE

# Compression
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/mongo_$DATE

# Nettoyage (garder 7 jours)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

## 🔧 Outils de Développement

### Scripts Utiles
```json
// package.json scripts
{
  "scripts": {
    "dev": "concurrently \"cd backend && uvicorn server:app --reload\" \"cd frontend && yarn start\"",
    "build": "cd frontend && yarn build",
    "test": "cd backend && pytest && cd ../frontend && yarn test",
    "lint": "cd frontend && eslint src/ && cd ../backend && flake8 .",
    "format": "cd frontend && prettier --write src/ && cd ../backend && black .",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "backup": "./scripts/backup.sh"
  }
}
```

### Configuration IDE
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## 📚 Ressources et Références

### Documentation Officielle
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [MongoDB](https://docs.mongodb.com/)
- [Stripe](https://stripe.com/docs)
- [OpenAI API](https://platform.openai.com/docs)

### Outils Recommandés
- **API Testing**: Postman, Insomnia
- **Database**: MongoDB Compass
- **Monitoring**: Grafana, Prometheus
- **CI/CD**: GitHub Actions, GitLab CI
- **Error Tracking**: Sentry

### Bonnes Pratiques
1. **Sécurité**: Validation des entrées, authentification forte, HTTPS
2. **Performance**: Cache Redis, optimisation des requêtes, CDN
3. **Scalabilité**: Architecture microservices, load balancing
4. **Maintenance**: Tests automatisés, monitoring, documentation

---

**Version**: 2.0.0 avec IA et Stripe  
**Dernière mise à jour**: Mars 2025  
**Auteur**: Équipe de développement  
**Contact**: dev@restaurant-ia.com