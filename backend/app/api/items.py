"""Items API endpoints."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Path
import logging
from google.cloud.firestore import Client, FieldFilter

from ..firestore_db import get_db
from ..schemas import ItemCreate, ItemOut, ItemKind

router = APIRouter()
logger = logging.getLogger("myvault.items")


@router.post("/", response_model=ItemOut, summary="Create item")
def create_item(payload: ItemCreate) -> ItemOut:
    """Create a new item."""
    try:
        with get_db() as db:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            ref = db.collection("items").document()
            doc = {
                "id": ref.id, 
                "kind": payload.kind, 
                "title": payload.title, 
                "content": payload.content, 
                "created_at": now, 
                "updated_at": now
            }
            ref.set(doc)
            logger.info(f"Created item {ref.id} of kind {payload.kind}")
            return doc
    except Exception as e:
        logger.error(f"Failed to create item: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create item: {str(e)}")


@router.get("/", response_model=list[ItemOut], summary="Get items")
def list_items(
    kind: Optional[ItemKind] = Query(None, description="Filter by item kind"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip")
) -> list[ItemOut]:
    """Get items with optional filters."""
    try:
        with get_db() as db:
            logger.info(f"Listing items: kind={kind}, limit={limit}, offset={offset}")
            q = db.collection("items")
            
            if kind:
                q = q.where(filter=FieldFilter("kind", "==", kind))
            
            try:
                q = q.order_by("created_at", direction="DESCENDING")
                docs = list(q.offset(offset).limit(limit).stream())
            except Exception as order_error:
                logger.warning(f"Failed to order by created_at: {order_error}")
                docs = list(q.offset(offset).limit(limit).stream())
            
            result = [d.to_dict() for d in docs]
            logger.info(f"Found {len(result)} items")
            return result
    except Exception as e:
        logger.error(f"Failed to list items: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list items: {str(e)}")


@router.get("/{item_id}", response_model=ItemOut, summary="Get item by ID")
def get_item(
    item_id: str = Path(..., description="Item ID")
) -> ItemOut:
    """Get a specific item by ID."""
    try:
        with get_db() as db:
            ref = db.collection("items").document(str(item_id))
            snap = ref.get()
            if not snap.exists:
                raise HTTPException(status_code=404, detail="Item not found")
            return snap.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get item: {str(e)}")


@router.delete("/{item_id}", summary="Delete item")
def delete_item(
    item_id: str = Path(..., description="Item ID")
) -> dict:
    """Delete an item."""
    try:
        with get_db() as db:
            ref = db.collection("items").document(str(item_id))
            if not ref.get().exists:
                raise HTTPException(status_code=404, detail="Item not found")
            ref.delete()
            logger.info(f"Deleted item {item_id}")
            return {"message": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")