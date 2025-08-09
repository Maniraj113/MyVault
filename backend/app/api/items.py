"""Items API endpoints."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Path
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Item
from ..schemas import ItemCreate, ItemOut, ItemKind

router = APIRouter()


@router.post("/", response_model=ItemOut, summary="Create item")
def create_item(payload: ItemCreate) -> ItemOut:
    """Create a new item."""
    with get_db() as db:
        item = Item(kind=payload.kind, title=payload.title, content=payload.content)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item


@router.get("/", response_model=list[ItemOut], summary="Get items")
def list_items(
    kind: Optional[ItemKind] = Query(None, description="Filter by item kind"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip")
) -> list[ItemOut]:
    """Get items with optional filters."""
    with get_db() as db:
        query = db.query(Item)
        if kind:
            query = query.filter(Item.kind == kind)
        return query.order_by(Item.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{item_id}", response_model=ItemOut, summary="Get item by ID")
def get_item(
    item_id: int = Path(..., description="Item ID")
) -> ItemOut:
    """Get a specific item by ID."""
    with get_db() as db:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return item


@router.delete("/{item_id}", summary="Delete item")
def delete_item(
    item_id: int = Path(..., description="Item ID")
) -> dict:
    """Delete an item."""
    with get_db() as db:
        item = db.query(Item).filter(Item.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        db.delete(item)
        db.commit()
        return {"message": "Item deleted successfully"}