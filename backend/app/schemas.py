from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal, Union
from enum import Enum

from pydantic import BaseModel, Field, field_validator


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


ItemKind = Literal["link", "note", "doc", "expense", "task", "health", "chat", "file"]


class ItemCreate(BaseModel):
    kind: ItemKind
    title: str = Field(min_length=1, max_length=300)
    content: Optional[str] = None


class ItemOut(BaseModel):
    id: str
    kind: ItemKind
    title: str
    content: Optional[str]
    created_at: Union[datetime, str]
    updated_at: Union[datetime, str]

    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                return v
        return v

    class Config:
        from_attributes = True


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class ExpenseCreate(BaseModel):
    title: str
    content: Optional[str] = None
    amount: float = Field(gt=0, description="Amount must be positive")
    category: ExpenseCategory
    is_income: bool = False
    occurred_on: Optional[datetime] = None


class ExpenseOut(BaseModel):
    id: str
    item_id: str
    title: str
    amount: float
    category: ExpenseCategory
    is_income: bool
    occurred_on: datetime
    created_at: datetime
    updated_at: datetime
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
    id: str
    item_id: str
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
    conversation_id: str = Field(min_length=1, max_length=100)


class ChatMessageEdit(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str = Field(min_length=1, max_length=100)


class ChatMessageUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(sent|delivered|read)$")
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None


class ChatMessageOut(BaseModel):
    id: str
    item_id: str
    message: str
    is_user: bool
    conversation_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    delivered_at: Optional[datetime]
    read_at: Optional[datetime]
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


class FileUploadOut(BaseModel):
    id: str
    item_id: str
    original_filename: str
    storage_path: str
    storage_bucket: str
    public_url: str
    content_type: str
    size: int
    folder: str
    uploaded_at: datetime
    item: ItemOut

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    title: str
    content: Optional[str] = None
    folder: str = Field(default="documents", description="Storage folder (documents, images, etc.)")
    is_public: bool = Field(default=True, description="Whether file should be publicly accessible")


