from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI(title="Restaurant Management System", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
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
    status: str = "pending"  # pending, confirmed, preparing, ready, delivered
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class OrderCreate(BaseModel):
    items: List[OrderItem]
    total: float

class Table(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: int
    seats: int
    status: str = "available"  # available, occupied, reserved
    
class Reservation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    table_id: str
    date: datetime
    guests: int
    status: str = "pending"  # pending, confirmed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReservationCreate(BaseModel):
    table_id: str
    date: datetime
    guests: int

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
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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

# Menu Routes
@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    menu_items = await db.menu_items.find({"available": True}).to_list(100)
    return [MenuItem(**item) for item in menu_items]

@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    item_dict = item.dict()
    item_obj = MenuItem(**item_dict)
    await db.menu_items.insert_one(item_obj.dict())
    return item_obj

@api_router.get("/menu/categories")
async def get_menu_categories():
    categories = await db.menu_items.distinct("category")
    return {"categories": categories}

# Order Routes
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

# Table Routes
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

# Reservation Routes
@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate, current_user: dict = Depends(get_current_user)):
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

# Stats Routes (Admin only)
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize demo data
@app.on_event("startup")
async def startup_event():
    # Check if admin user exists
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
    
    # Check if menu items exist
    menu_count = await db.menu_items.count_documents({})
    if menu_count == 0:
        demo_menu = [
            {
                "id": str(uuid.uuid4()),
                "name": "Burger Classic",
                "description": "Burger artisanal avec fromage, salade et tomate",
                "price": 12.90,
                "category": "Plats",
                "image_url": "https://images.unsplash.com/photo-1700513970028-d8a630d21c6e",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Salade César",
                "description": "Salade fraîche avec poulet grillé et parmesan",
                "price": 9.50,
                "category": "Entrées",
                "image_url": "https://images.unsplash.com/photo-1556742393-d75f468bfcb0",
                "available": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Cocktail Signature",
                "description": "Cocktail maison aux fruits frais",
                "price": 8.00,
                "category": "Boissons",
                "image_url": "https://images.unsplash.com/photo-1700513970042-f1fc4236c0bc",
                "available": True,
                "created_at": datetime.utcnow()
            }
        ]
        await db.menu_items.insert_many(demo_menu)
        logger.info("Demo menu items created")
    
    # Check if tables exist
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