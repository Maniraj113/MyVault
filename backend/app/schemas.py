from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal
from enum import Enum

from pydantic import BaseModel, Field


class ExpenseCategory(str, Enum):
    """Predefined expense categories."""
    TRANSPORT = "transport"
    SAVINGS = "savings" 
    GROCERY = "grocery"
    VEGETABLES = "vegetables"
    OTHER = "other"
    PERSONAL = "personal"
    CLOTHING = "clothing"
    FUN = "fun"
    FUEL = "fuel"
    RESTAURANT = "restaurant"
    SNACKS = "snacks"
    HEALTH = "health"


ItemKind = Literal["link", "note", "doc", "expense", "task", "health", "chat"]


class ItemCreate(BaseModel):
    kind: ItemKind
    title: str = Field(min_length=1, max_length=300)
    content: Optional[str] = None


class ItemOut(BaseModel):
    id: int
    kind: ItemKind
    title: str
    content: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    title: str
    content: Optional[str] = None
    amount: float = Field(gt=0, description="Amount must be positive")
    category: ExpenseCategory
    is_income: bool = False
    occurred_on: Optional[datetime] = None


class ExpenseOut(BaseModel):
    id: int
    item_id: int
    amount: float
    category: ExpenseCategory
    is_income: bool
    occurred_on: datetime
    item: ItemOut

    class Config:
        from_attributes = True


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[ExpenseCategory] = None
    is_income: Optional[bool] = None
    occurred_on: Optional[datetime] = None


class TaskCreate(BaseModel):
    title: str
    content: Optional[str] = None
    due_at: Optional[datetime] = None


class TaskOut(BaseModel):
    id: int
    item_id: int
    due_at: Optional[datetime]
    is_done: bool
    item: ItemOut

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    due_at: Optional[datetime] = None
    is_done: Optional[bool] = None


class ChatMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[str] = None


class ChatMessageOut(BaseModel):
    id: int
    item_id: int
    message: str
    is_user: bool
    conversation_id: Optional[str]
    item: ItemOut

    class Config:
        from_attributes = True


class ExpenseReport(BaseModel):
    category: ExpenseCategory
    total_amount: float
    count: int
    is_income: bool


class MonthlyReport(BaseModel):
    month: str
    total_income: float
    total_expense: float
    net_amount: float
    expense_by_category: list[ExpenseReport]


