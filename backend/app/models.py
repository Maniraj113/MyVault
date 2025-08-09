from __future__ import annotations

from datetime import datetime
from typing import Optional
from enum import Enum

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


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


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kind: Mapped[str] = mapped_column(String(20), index=True)  # link | note | doc | expense | task | health | chat
    title: Mapped[str] = mapped_column(String(300))
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # url/text/json snippets
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    expense: Mapped[Optional[Expense]] = relationship(back_populates="item", uselist=False)
    task: Mapped[Optional[Task]] = relationship(back_populates="item", uselist=False)
    chat_message: Mapped[Optional[ChatMessage]] = relationship(back_populates="item", uselist=False)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), unique=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    category: Mapped[ExpenseCategory] = mapped_column(String(50))
    is_income: Mapped[bool] = mapped_column(Boolean, default=False)  # True for income, False for expense
    occurred_on: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    item: Mapped[Item] = relationship(back_populates="expense")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), unique=True)
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)

    item: Mapped[Item] = relationship(back_populates="task")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"), unique=True)
    message: Mapped[str] = mapped_column(Text)
    is_user: Mapped[bool] = mapped_column(Boolean, default=True)  # True for user messages, False for system/bot
    conversation_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    item: Mapped[Item] = relationship(back_populates="chat_message")


