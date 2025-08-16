"""Items API endpoints."""
from __future__ import annotations

from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Path
import logging
from google.cloud.firestore import Client, FieldFilter

from ..firestore_db import get_db
from ..schemas import ItemCreate, ItemOut, ItemKind, ItemUpdate

router = APIRouter()
logger = logging.getLogger("myvault.items")


@router.post("/", response_model=ItemOut, summary="Create item")
def create_item(payload: ItemCreate) -> ItemOut:
    """Create a new item."""
    try:
        with get_db() as db:
            ref = db.collection("items").document()
            doc = {
                "id": ref.id, 
                "kind": payload.kind, 
                "title": payload.title, 
                "content": payload.content, 
                "created_at": datetime.now(timezone.utc), 
                "updated_at": datetime.now(timezone.utc)
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
            
            result = []
            for doc in docs:
                doc_data = doc.to_dict()
                # Ensure all required fields are present
                if not doc_data.get("kind"):
                    doc_data["kind"] = "note"  # Default fallback
                if not doc_data.get("content"):
                    doc_data["content"] = None
                if not doc_data.get("created_at"):
                    doc_data["created_at"] = datetime.now(timezone.utc)
                if not doc_data.get("updated_at"):
                    doc_data["updated_at"] = doc_data.get("created_at", datetime.now(timezone.utc))
                result.append(doc_data)
            
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
            
            doc_data = snap.to_dict()
            # Ensure all required fields are present
            if not doc_data.get("kind"):
                doc_data["kind"] = "note"  # Default fallback
            if not doc_data.get("content"):
                doc_data["content"] = None
            if not doc_data.get("created_at"):
                doc_data["created_at"] = datetime.now(timezone.utc)
            if not doc_data.get("updated_at"):
                doc_data["updated_at"] = doc_data.get("created_at", datetime.now(timezone.utc))
            
            return doc_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get item: {str(e)}")


@router.put("/{item_id}", response_model=ItemOut, summary="Update item")
def update_item(
    item_id: str = Path(..., description="Item ID"),
    payload: ItemUpdate = ...
) -> ItemOut:
    """Update an existing item."""
    try:
        with get_db() as db:
            ref = db.collection("items").document(str(item_id))
            snap = ref.get()
            if not snap.exists:
                raise HTTPException(status_code=404, detail="Item not found")
            
            # Prepare update data
            update_data = {}
            if payload.title is not None:
                update_data["title"] = payload.title
            if payload.content is not None:
                update_data["content"] = payload.content
            
            update_data["updated_at"] = datetime.now(timezone.utc)
            
            # Update the document
            ref.update(update_data)
            
            # Get updated document
            updated_snap = ref.get()
            logger.info(f"Updated item {item_id}")
            return updated_snap.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update item: {str(e)}")


@router.delete("/{item_id}", summary="Delete item")
def delete_item(
    item_id: str = Path(..., description="Item ID")
) -> dict:
    """Delete an item."""
    try:
        with get_db() as db:
            ref = db.collection("items").document(str(item_id))
            snap = ref.get()
            if not snap.exists:
                raise HTTPException(status_code=404, detail="Item not found")
            
            # Get item data to check if it has associated files
            item_data = snap.to_dict()
            
            # Delete associated file from storage if it exists
            if item_data.get("fileUrl"):
                try:
                    from ..storage import delete_file
                    # Extract storage path from fileUrl
                    file_url = item_data["fileUrl"]
                    if "firebasestorage.googleapis.com" in file_url:
                        # Extract the storage path from the URL
                        # URL format: https://storage.googleapis.com/BUCKET/PATH
                        parts = file_url.split("/")
                        if len(parts) >= 5:
                            bucket_name = parts[3]
                            storage_path = "/".join(parts[4:])
                            if delete_file(storage_path):
                                logger.info(f"Deleted file from storage: {storage_path}")
                            else:
                                logger.warning(f"Failed to delete file from storage: {storage_path}")
                except Exception as e:
                    logger.warning(f"Failed to delete associated file: {str(e)}")
            
            # Delete the item document
            ref.delete()
            logger.info(f"Deleted item {item_id}")
            return {"message": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")