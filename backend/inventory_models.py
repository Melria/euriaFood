from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid

class InventoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    current_stock: int
    min_stock_level: int
    max_stock_level: int
    unit: str  # kg, pieces, liters, etc.
    cost_per_unit: float
    supplier: str
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
class InventoryCreate(BaseModel):
    name: str
    category: str
    current_stock: int
    min_stock_level: int
    max_stock_level: int
    unit: str
    cost_per_unit: float
    supplier: str

class StockMovement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inventory_item_id: str
    movement_type: str  # in, out, adjustment
    quantity: int
    reason: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str

class DemandForecast(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    forecast_date: datetime
    predicted_demand: float
    confidence_score: float
    factors: List[str] = []
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class StockAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inventory_item_id: str
    alert_type: str  # low_stock, expiring, overstock
    message: str
    priority: str  # low, medium, high, critical
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False

class MenuItemIngredient(BaseModel):
    ingredient_id: str
    quantity_needed: float
    unit: str

class MenuItemWithIngredients(BaseModel):
    menu_item_id: str
    ingredients: List[MenuItemIngredient]