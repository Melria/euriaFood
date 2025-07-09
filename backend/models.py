from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid

# Modèles existants étendus
class PaymentCreate(BaseModel):
    amount: float
    currency: str = "eur"
    payment_method: str  # "card", "cash"
    order_id: str

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    amount: float
    currency: str
    payment_method: str
    stripe_payment_intent_id: Optional[str] = None
    status: str = "pending"  # pending, succeeded, failed, refunded
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    available: Optional[bool] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    items: Optional[List] = None
    total: Optional[float] = None

class TableUpdate(BaseModel):
    number: Optional[int] = None
    seats: Optional[int] = None
    status: Optional[str] = None

class ReservationUpdate(BaseModel):
    table_id: Optional[str] = None
    date: Optional[datetime] = None
    guests: Optional[int] = None
    status: Optional[str] = None

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    order_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewCreate(BaseModel):
    order_id: str
    rating: int
    comment: Optional[str] = None

class FavoriteOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    items: List[Dict]
    total: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FavoriteOrderCreate(BaseModel):
    name: str
    items: List[Dict]
    total: float

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str  # order_ready, stock_alert, reservation_reminder
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DailyReport(BaseModel):
    date: datetime
    total_orders: int
    total_revenue: float
    average_order_value: float
    top_selling_items: List[Dict]
    orders_by_status: Dict[str, int]