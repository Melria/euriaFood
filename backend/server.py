from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from ai_service import ai_service
from inventory_models import *
from models import *
from payment_service import payment_service
from report_service import report_service
import stripe
import stripe.error
from datetime import date
import base64
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('DATABASE_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'restaurant_db')]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI(title="Restaurant Management System IA", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Stripe webhook endpoint (sans prefix /api)
@app.post("/webhook/stripe")
async def stripe_webhook(request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, payment_service.webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        # Mettre à jour le statut de la commande
        order_id = payment_intent['metadata'].get('order_id')
        if order_id:
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
    
    return {"status": "success"}

# Modèles existants
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    role: str  # "admin", "client", "staff"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "client"

class UserLogin(BaseModel):
    email: str
    password: str

class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    image_url: str
    available: bool = True
    popularity_score: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    available: bool = True

class OrderItem(BaseModel):
    menu_item_id: str
    quantity: int
    price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total: float
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class OrderCreate(BaseModel):
    items: List[OrderItem]
    total: float

class Table(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: int
    seats: int
    status: str = "available"
    
class Reservation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    table_id: str
    date: datetime
    guests: int
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReservationCreate(BaseModel):
    table_id: str
    date: datetime
    guests: int

# Nouveaux modèles IA
class RecommendationRequest(BaseModel):
    user_id: str
    preferences: Optional[dict] = None

class ForecastRequest(BaseModel):
    days_ahead: int = 7
    include_external_factors: bool = True

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)  # Extended to 24 hours
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.error("Token payload missing user ID")
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            logger.error(f"User not found for ID: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Auth Routes
@api_router.post("/auth/register")
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.dict()
    user_dict["password_hash"] = hash_password(user.password)
    del user_dict["password"]
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return {"message": "User created successfully"}

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user["id"]})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user["id"], "name": db_user["name"], "email": db_user["email"], "role": db_user["role"]}}

# Routes IA - Recommandations
@api_router.post("/ai/recommendations")
async def get_ai_recommendations(request: RecommendationRequest, current_user: dict = Depends(get_current_user)):
    """Obtenir des recommandations IA personnalisées"""
    try:
        # Récupérer l'historique des commandes
        order_history = await db.orders.find({"user_id": request.user_id}).sort("created_at", -1).limit(20).to_list(20)
        
        if not order_history:
            # Recommandations par défaut pour nouveaux utilisateurs
            menu_items = await db.menu_items.find().limit(5).to_list(5)
            default_recommendations = {
                "recommended_items": [
                    {
                        "name": item.get("name", "Plat recommandé"),
                        "reason": "Plat populaire pour les nouveaux clients",
                        "confidence_score": 0.8
                    } for item in menu_items[:3]
                ],
                "insights": "Nouveau client - recommandations basées sur la popularité générale"
            }
            return {"status": "success", "recommendations": default_recommendations}
        
        # Générer recommandations avec IA
        recommendations_result = await ai_service.generate_menu_recommendations(
            request.user_id, order_history, request.preferences or {}
        )
        
        # Vérifier si l'IA a retourné une erreur
        if isinstance(recommendations_result, dict) and "error" in recommendations_result:
            logger.error(f"AI recommendations error: {recommendations_result['error']}")
            # Retourner des recommandations par défaut
            return {
                "status": "success", 
                "recommendations": {
                    "recommended_items": [
                        {"name": "Plat du jour", "reason": "Recommandation par défaut", "confidence_score": 0.7}
                    ],
                    "insights": "Service IA temporairement indisponible"
                }
            }
        
        return {"status": "success", "recommendations": recommendations_result}
    except Exception as e:
        logger.error(f"Error in get_ai_recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur recommandations IA: {str(e)}")

# Routes IA - Prédiction de stock
@api_router.post("/ai/inventory/forecast")
async def get_inventory_forecast(request: ForecastRequest, current_user: dict = Depends(get_current_user)):
    """Prédiction intelligente de la demande d'inventaire"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Récupérer données historiques
        historical_data = await db.orders.find().sort("created_at", -1).limit(1000).to_list(1000)
        
        # Générer prédictions
        forecast = await ai_service.predict_inventory_demand(historical_data, request.days_ahead)
        
        return {"status": "success", "forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction inventaire: {str(e)}")

# Routes IA - Optimisation prix
@api_router.post("/ai/pricing/optimize")
async def optimize_pricing(current_user: dict = Depends(get_current_user)):
    """Optimisation intelligente des prix"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Récupérer items du menu
        menu_items = await db.menu_items.find().to_list(100)
        
        # Données marché (simulation)
        market_data = {"competition": "moderate", "demand_trend": "stable"}
        
        # Optimiser prix
        optimization = await ai_service.optimize_pricing(menu_items, market_data)
        
        return {"status": "success", "optimization": optimization}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur optimisation prix: {str(e)}")

# Routes IA - Insights business
@api_router.get("/ai/insights")
async def get_business_insights(current_user: dict = Depends(get_current_user)):
    """Insights business intelligents"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Récupérer données analytics
        orders = await db.orders.find().sort("created_at", -1).limit(500).to_list(500)
        menu_items = await db.menu_items.find().to_list(100)
        
        if not orders:
            # Retourner des données de démonstration si pas de commandes
            return {
                "status": "success", 
                "insights": {
                    "insights": ["Aucune commande trouvée pour générer des insights. Commencez par ajouter des commandes."],
                    "recommendations": ["Ajoutez des plats populaires au menu", "Configurez les prix de manière compétitive"],
                    "summary": "Restaurant en phase de démarrage"
                }
            }
        
        analytics_data = {
            "orders": orders[:50],  # Limiter pour l'IA
            "menu_items": menu_items,
            "period": "last_30_days"
        }
        
        # Générer insights
        insights_result = await ai_service.generate_business_insights(analytics_data)
        
        # Vérifier si l'IA a retourné une erreur
        if isinstance(insights_result, dict) and "error" in insights_result:
            logger.error(f"AI Service error: {insights_result['error']}")
            # Retourner des insights par défaut en cas d'erreur IA
            return {
                "status": "success", 
                "insights": {
                    "insights": ["Service IA temporairement indisponible. Insights génériques activés."],
                    "recommendations": ["Analyser les tendances de vente manuellement", "Vérifier la configuration de l'API OpenAI"],
                    "summary": "Données disponibles mais IA hors ligne"
                }
            }
        
        return {"status": "success", "insights": insights_result}
    except Exception as e:
        logger.error(f"Error in get_business_insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur insights business: {str(e)}")

# Gestion Inventaire
@api_router.get("/inventory", response_model=List[InventoryItem])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    inventory = await db.inventory.find().to_list(100)
    return [InventoryItem(**item) for item in inventory]

@api_router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(item: InventoryCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    item_dict = item.dict()
    item_obj = InventoryItem(**item_dict)
    await db.inventory.insert_one(item_obj.dict())
    return item_obj

@api_router.put("/inventory/{item_id}")
async def update_inventory_item(
    item_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if item exists
    existing_item = await db.inventory.find_one({"id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Update the item
    await db.inventory.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    
    # Return updated item
    updated_item = await db.inventory.find_one({"id": item_id})
    return {"message": "Inventory item updated successfully", "item": updated_item}

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if item exists
    existing_item = await db.inventory.find_one({"id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Delete the item
    await db.inventory.delete_one({"id": item_id})
    return {"message": "Inventory item deleted successfully"}

@api_router.post("/inventory/sync-with-menu")
async def sync_inventory_with_menu(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all menu items
    menu_items = await db.menu.find().to_list(1000)
    
    # Get existing inventory items
    existing_inventory = await db.inventory.find().to_list(1000)
    existing_items_dict = {item["name"]: item for item in existing_inventory}
    
    created_count = 0
    updated_count = 0
    
    for menu_item in menu_items:
        if menu_item["name"] not in existing_items_dict:
            # Create new inventory item based on menu item
            inventory_item = {
                "id": str(uuid.uuid4()),
                "name": menu_item["name"],
                "category": menu_item.get("category", "General"),
                "current_stock": 50,  # Default starting stock
                "min_stock_level": 10,  # Default minimum level
                "max_stock_level": 100,  # Default maximum level
                "unit": "pièces",  # Default unit
                "cost_per_unit": menu_item.get("price", 0) * 0.6,  # Estimate cost as 60% of selling price
                "supplier": "Fournisseur par défaut",
                "last_restocked": datetime.utcnow(),
                "expiry_date": datetime.utcnow() + timedelta(days=30)  # Default 30 days expiry
            }
            await db.inventory.insert_one(inventory_item)
            created_count += 1
        else:
            # Update existing item if needed
            existing_item = existing_items_dict[menu_item["name"]]
            if existing_item.get("category") != menu_item.get("category"):
                await db.inventory.update_one(
                    {"id": existing_item["id"]},
                    {"$set": {"category": menu_item.get("category", "General")}}
                )
                updated_count += 1
    
    return {
        "message": "Inventory synchronized with menu",
        "created_items": created_count,
        "updated_items": updated_count
    }

@api_router.get("/inventory/alerts")
async def get_stock_alerts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Récupérer les alertes de stock
    inventory = await db.inventory.find().to_list(100)
    alerts = []
    
    for item in inventory:
        if item["current_stock"] <= item["min_stock_level"]:
            alerts.append({
                "id": str(uuid.uuid4()),
                "inventory_item_id": item["id"],
                "alert_type": "low_stock",
                "message": f"Stock faible pour {item['name']}: {item['current_stock']} {item['unit']}",
                "priority": "high" if item["current_stock"] == 0 else "medium",
                "created_at": datetime.utcnow(),
                "resolved": False
            })
    
    return {"alerts": alerts}

# Routes existantes (menu, commandes, etc.)
@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    menu_items = await db.menu_items.find({"available": True}).to_list(100)
    return [MenuItem(**item) for item in menu_items]

@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"Creating menu item: {item.name} by user: {current_user.get('email', 'unknown')}")
        
        if current_user["role"] != "admin":
            logger.warning(f"Non-admin user {current_user.get('email')} attempted to create menu item")
            raise HTTPException(status_code=403, detail="Admin access required")
        
        item_dict = item.dict()
        item_obj = MenuItem(**item_dict)
        
        # Insert into database
        result = await db.menu_items.insert_one(item_obj.dict())
        logger.info(f"Menu item created successfully with ID: {result.inserted_id}")
        
        return item_obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating menu item: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/menu/categories")
async def get_menu_categories():
    categories = await db.menu_items.distinct("category")
    return {"categories": categories}

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_dict = order.dict()
    order_dict["user_id"] = current_user["id"]
    order_obj = Order(**order_dict)
    await db.orders.insert_one(order_obj.dict())
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        orders = await db.orders.find().to_list(100)
    else:
        orders = await db.orders.find({"user_id": current_user["id"]}).to_list(100)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user["role"] != "admin" and order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    return {"message": "Order status updated"}

# Routes Paiement
@api_router.post("/payments/create-intent")
async def create_payment_intent(payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    try:
        # Vérifier que la commande appartient à l'utilisateur
        order = await db.orders.find_one({"id": payment.order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if payment.payment_method == "card":
            # Créer PaymentIntent Stripe
            intent = await payment_service.create_payment_intent(
                amount=payment.amount,
                currency=payment.currency,
                metadata={"order_id": payment.order_id, "user_id": current_user["id"]}
            )
            
            # Sauvegarder le paiement
            payment_obj = Payment(
                order_id=payment.order_id,
                amount=payment.amount,
                currency=payment.currency,
                payment_method=payment.payment_method,
                stripe_payment_intent_id=intent["payment_intent_id"]
            )
            await db.payments.insert_one(payment_obj.dict())
            
            return intent
        else:
            # Paiement en espèces
            payment_obj = Payment(
                order_id=payment.order_id,
                amount=payment.amount,
                currency=payment.currency,
                payment_method=payment.payment_method,
                status="pending_cash"
            )
            await db.payments.insert_one(payment_obj.dict())
            return {"status": "pending_cash", "message": "Paiement en espèces à effectuer"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payments/{payment_id}/confirm")
async def confirm_payment(payment_id: str, current_user: dict = Depends(get_current_user)):
    payment = await db.payments.find_one({"stripe_payment_intent_id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    try:
        result = await payment_service.confirm_payment(payment_id)
        
        # Mettre à jour le statut du paiement
        await db.payments.update_one(
            {"stripe_payment_intent_id": payment_id},
            {"$set": {"status": result["status"]}}
        )
        
        # Mettre à jour la commande si paiement réussi
        if result["status"] == "succeeded":
            await db.orders.update_one(
                {"id": payment["order_id"]},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Routes CRUD Admin - Menu
@api_router.put("/menu/{item_id}")
async def update_menu_item(item_id: str, item: MenuItemUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in item.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.menu_items.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return {"message": "Menu item updated successfully"}

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return {"message": "Menu item deleted successfully"}

# Routes CRUD Admin - Tables
@api_router.put("/tables/{table_id}")
async def update_table(table_id: str, table: TableUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in table.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.tables.update_one({"id": table_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return {"message": "Table updated successfully"}

@api_router.delete("/tables/{table_id}")
async def delete_table(table_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.tables.delete_one({"id": table_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    
    return {"message": "Table deleted successfully"}

# Routes CRUD Admin - Commandes
@api_router.put("/orders/{order_id}")
async def update_order(order_id: str, order: OrderUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in order.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order updated successfully"}

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order deleted successfully"}

# Routes Rapports
@api_router.get("/reports/daily")
async def get_daily_report(report_date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        if report_date:
            target_date = datetime.fromisoformat(report_date)
        else:
            target_date = datetime.now()
        
        # Début et fin de la journée
        start_date = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Récupérer les commandes du jour
        orders = await db.orders.find({
            "created_at": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }).to_list(1000)
        
        # Générer le PDF
        pdf_content = report_service.generate_daily_report(orders, target_date)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=rapport_{target_date.strftime('%Y%m%d')}.pdf"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération rapport: {str(e)}")

@api_router.get("/orders/{order_id}/invoice")
async def get_invoice(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Vérifier les permissions
    if current_user["role"] != "admin" and order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Récupérer les infos utilisateur
        user = await db.users.find_one({"id": order["user_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Générer la facture PDF
        pdf_content = report_service.generate_invoice(order, user)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=facture_{order_id[:8]}.pdf"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération facture: {str(e)}")

@api_router.post("/reports/generate")
async def generate_report(period: str = Query(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Calculate date range based on period
        now = datetime.now()
        
        if period == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif period == "week":
            start_date = now - timedelta(days=7)
            end_date = now
        elif period == "month":
            start_date = now - timedelta(days=30)
            end_date = now
        else:
            raise HTTPException(status_code=400, detail="Invalid period")
        
        # Get orders for the period
        orders = await db.orders.find({
            "created_at": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }).to_list(1000)
        
        # Generate the PDF report
        pdf_content = report_service.generate_period_report(orders, period, start_date, end_date)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=rapport_{period}_{now.strftime('%Y%m%d')}.pdf"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération rapport: {str(e)}")

# Routes Avis clients
@api_router.post("/reviews", response_model=Review)
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    # Vérifier que la commande existe et appartient à l'utilisateur
    order = await db.orders.find_one({"id": review.order_id, "user_id": current_user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Vérifier qu'il n'y a pas déjà un avis
    existing_review = await db.reviews.find_one({"order_id": review.order_id, "user_id": current_user["id"]})
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this order")
    
    review_dict = review.dict()
    review_dict["user_id"] = current_user["id"]
    review_obj = Review(**review_dict)
    await db.reviews.insert_one(review_obj.dict())
    return review_obj

@api_router.get("/reviews", response_model=List[Review])
async def get_reviews(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        reviews = await db.reviews.find().to_list(100)
    else:
        reviews = await db.reviews.find({"user_id": current_user["id"]}).to_list(100)
    return [Review(**review) for review in reviews]

# Routes Commandes favorites
@api_router.post("/favorites", response_model=FavoriteOrder)
async def create_favorite_order(favorite: FavoriteOrderCreate, current_user: dict = Depends(get_current_user)):
    favorite_dict = favorite.dict()
    favorite_dict["user_id"] = current_user["id"]
    favorite_obj = FavoriteOrder(**favorite_dict)
    await db.favorite_orders.insert_one(favorite_obj.dict())
    return favorite_obj

@api_router.get("/favorites", response_model=List[FavoriteOrder])
async def get_favorite_orders(current_user: dict = Depends(get_current_user)):
    favorites = await db.favorite_orders.find({"user_id": current_user["id"]}).to_list(50)
    return [FavoriteOrder(**fav) for fav in favorites]

@api_router.delete("/favorites/{favorite_id}")
async def delete_favorite_order(favorite_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.favorite_orders.delete_one({"id": favorite_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite order not found")
    return {"message": "Favorite order deleted"}

# Routes Notifications
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(50)
    return [Notification(**notif) for notif in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# Route annulation commande
@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Vérifier les permissions
    if current_user["role"] != "admin" and order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Vérifier si la commande peut être annulée (pas encore en préparation)
    if order["status"] in ["preparing", "ready", "delivered"]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in current status")
    
    # Annuler la commande
    await db.orders.update_one({"id": order_id}, {"$set": {"status": "cancelled"}})
    
    # Si paiement par carte, créer un remboursement
    payment = await db.payments.find_one({"order_id": order_id, "payment_method": "card"})
    if payment and payment.get("stripe_payment_intent_id"):
        try:
            await payment_service.create_refund(payment["stripe_payment_intent_id"])
            await db.payments.update_one(
                {"order_id": order_id},
                {"$set": {"status": "refunded"}}
            )
        except Exception as e:
            logger.error(f"Erreur remboursement: {e}")
    
    return {"message": "Order cancelled successfully"}

@api_router.get("/tables", response_model=List[Table])
async def get_tables():
    tables = await db.tables.find().to_list(50)
    return [Table(**table) for table in tables]

@api_router.post("/tables", response_model=Table)
async def create_table(table: Table, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.tables.insert_one(table.dict())
    return table

@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate, current_user: dict = Depends(get_current_user)):
    # Validate table exists and get table info
    table = await db.tables.find_one({"id": reservation.table_id})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Validate guest count doesn't exceed table capacity
    if reservation.guests > table["seats"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Too many guests for this table. Maximum capacity is {table['seats']} guests."
        )
    
    # Check for existing reservations at the same time (2-hour window)
    reservation_datetime = reservation.date
    start_window = reservation_datetime - timedelta(hours=1)
    end_window = reservation_datetime + timedelta(hours=1)
    
    existing_reservation = await db.reservations.find_one({
        "table_id": reservation.table_id,
        "date": {
            "$gte": start_window.isoformat(),
            "$lte": end_window.isoformat()
        },
        "status": {"$ne": "cancelled"}
    })
    
    if existing_reservation:
        raise HTTPException(
            status_code=409, 
            detail="This table is already reserved for this time slot. Please choose a different time or table."
        )
    
    # Check for duplicate reservation by same user
    duplicate_reservation = await db.reservations.find_one({
        "user_id": current_user["id"],
        "table_id": reservation.table_id,
        "date": reservation_datetime.isoformat(),
        "status": {"$ne": "cancelled"}
    })
    
    if duplicate_reservation:
        raise HTTPException(
            status_code=409,
            detail="You already have a reservation for this table at this time."
        )
    
    reservation_dict = reservation.dict()
    reservation_dict["user_id"] = current_user["id"]
    reservation_obj = Reservation(**reservation_dict)
    await db.reservations.insert_one(reservation_obj.dict())
    return reservation_obj

@api_router.get("/reservations", response_model=List[Reservation])
async def get_reservations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        reservations = await db.reservations.find().to_list(100)
    else:
        reservations = await db.reservations.find({"user_id": current_user["id"]}).to_list(100)
    return [Reservation(**reservation) for reservation in reservations]

@api_router.get("/tables/availability")
async def check_table_availability(
    date: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Check which tables are available for a specific date and time"""
    try:
        reservation_datetime = datetime.fromisoformat(date.replace('Z', '+00:00'))
        start_window = reservation_datetime - timedelta(hours=1)
        end_window = reservation_datetime + timedelta(hours=1)
        
        # Get all tables
        all_tables = await db.tables.find().to_list(100)
        
        # Get existing reservations in the time window
        existing_reservations = await db.reservations.find({
            "date": {
                "$gte": start_window.isoformat(),
                "$lte": end_window.isoformat()
            },
            "status": {"$ne": "cancelled"}
        }).to_list(100)
        
        # Mark tables as unavailable if they have reservations
        reserved_table_ids = {res["table_id"] for res in existing_reservations}
        
        for table in all_tables:
            table["available_for_reservation"] = table["id"] not in reserved_table_ids
            
        return {"tables": all_tables}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

@api_router.put("/reservations/{reservation_id}")
async def update_reservation(
    reservation_id: str, 
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    # Check if reservation exists and user has permission using custom id field
    existing_reservation = await db.reservations.find_one({"id": reservation_id})
    if not existing_reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Allow admin to update any reservation, or user to update their own
    if current_user["role"] != "admin" and existing_reservation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Update the reservation
    await db.reservations.update_one(
        {"id": reservation_id},
        {"$set": update_data}
    )
    
    # Return updated reservation
    updated_reservation = await db.reservations.find_one({"id": reservation_id})
    return {"message": "Reservation updated successfully", "reservation": updated_reservation}

@api_router.delete("/reservations/{reservation_id}")
async def delete_reservation(
    reservation_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Check if reservation exists and user has permission using custom id field
    existing_reservation = await db.reservations.find_one({"id": reservation_id})
    if not existing_reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Allow admin to delete any reservation, or user to delete their own
    if current_user["role"] != "admin" and existing_reservation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Delete the reservation
    await db.reservations.delete_one({"id": reservation_id})
    return {"message": "Reservation deleted successfully"}

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "client"})
    total_revenue = await db.orders.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    
    return {
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue[0]["total"] if total_revenue else 0,
        "today_orders": await db.orders.count_documents({
            "created_at": {"$gte": datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}
        })
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize demo data
@app.on_event("startup")
async def startup_event():
    # Admin user
    admin_user = await db.users.find_one({"email": "admin@restaurant.com"})
    if not admin_user:
        admin_dict = {
            "id": str(uuid.uuid4()),
            "email": "admin@restaurant.com",
            "password_hash": hash_password("admin123"),
            "name": "Admin User",
            "role": "admin",
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_dict)
        logger.info("Admin user created: admin@restaurant.com / admin123")
    
    # Menu items avec données IA
    menu_count = await db.menu_items.count_documents({})
    if menu_count == 0:
        demo_menu = [
            {
                "id": str(uuid.uuid4()),
                "name": "Burger Classic IA",
                "description": "Burger artisanal optimisé par IA avec fromage, salade et tomate",
                "price": 12.90,
                "category": "Plats",
                "image_url": "https://images.unsplash.com/photo-1700513970028-d8a630d21c6e",
                "available": True,
                "popularity_score": 0.92,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Salade Smart César",
                "description": "Salade optimisée avec recommandations nutritionnelles IA",
                "price": 9.50,
                "category": "Entrées",
                "image_url": "https://images.unsplash.com/photo-1556742393-d75f468bfcb0",
                "available": True,
                "popularity_score": 0.87,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cocktail IA Signature",
                "description": "Cocktail aux fruits frais avec recette optimisée par intelligence artificielle",
                "price": 8.00,
                "category": "Boissons",
                "image_url": "https://images.unsplash.com/photo-1700513970042-f1fc4236c0bc",
                "available": True,
                "popularity_score": 0.75,
                "created_at": datetime.utcnow()
            }
        ]
        await db.menu_items.insert_many(demo_menu)
        logger.info("Demo menu items IA created")
    
    # Tables
    table_count = await db.tables.count_documents({})
    if table_count == 0:
        demo_tables = [
            {"id": str(uuid.uuid4()), "number": 1, "seats": 2, "status": "available"},
            {"id": str(uuid.uuid4()), "number": 2, "seats": 4, "status": "available"},
            {"id": str(uuid.uuid4()), "number": 3, "seats": 6, "status": "available"},
            {"id": str(uuid.uuid4()), "number": 4, "seats": 2, "status": "available"}
        ]
        await db.tables.insert_many(demo_tables)
        logger.info("Demo tables created")
    
    # Inventaire initial
    inventory_count = await db.inventory.count_documents({})
    if inventory_count == 0:
        demo_inventory = [
            {
                "id": str(uuid.uuid4()),
                "name": "Pain burger",
                "category": "Boulangerie",
                "current_stock": 50,
                "min_stock_level": 20,
                "max_stock_level": 100,
                "unit": "pièces",
                "cost_per_unit": 0.50,
                "supplier": "Boulangerie Locale",
                "last_updated": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Salade verte",
                "category": "Légumes",
                "current_stock": 15,
                "min_stock_level": 10,
                "max_stock_level": 30,
                "unit": "kg",
                "cost_per_unit": 2.50,
                "supplier": "Maraîcher Bio",
                "last_updated": datetime.utcnow()
            }
        ]
        await db.inventory.insert_many(demo_inventory)
        logger.info("Demo inventory created")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)