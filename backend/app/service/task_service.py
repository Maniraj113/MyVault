"""Task service refactored to Firestore."""
from __future__ import annotations

from datetime import datetime, date, timezone
from typing import Optional

from google.cloud.firestore import Client, FieldFilter

from ..schemas import TaskCreate, TaskUpdate


def create_task(db: Client, payload: TaskCreate) -> dict:
    now = datetime.now(timezone.utc)
    task_ref = db.collection("tasks").document()
    
    # Create task document with embedded item data
    task_doc = {
        "id": task_ref.id,
        "item_id": task_ref.id,  # Add item_id field
        "title": payload.title,
        "content": payload.content,
        "kind": "task",
        "due_at": payload.due_at,
        "is_done": False,
        "created_at": now,
        "updated_at": now,
        # Add the required item field
        "item": {
            "id": task_ref.id,
            "kind": "task",
            "title": payload.title,
            "content": payload.content,
            "created_at": now,
            "updated_at": now
        }
    }
    
    # Set the task document
    task_ref.set(task_doc)
    return task_ref.get().to_dict()


def get_tasks(
    db: Client,
    is_done: Optional[bool] = None,
    due_date: Optional[date] = None,
    overdue: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    q = db.collection("tasks")
    if is_done is not None:
        q = q.where(filter=FieldFilter("is_done", "==", is_done))
    if due_date:
        start_of_day = datetime.combine(due_date, datetime.min.time())
        end_of_day = datetime.combine(due_date, datetime.max.time())
        q = q.where(filter=FieldFilter("due_at", ">=", start_of_day)).where(filter=FieldFilter("due_at", "<=", end_of_day))
    
    if overdue:
        q = q.where(filter=FieldFilter("due_at", "<", datetime.now(timezone.utc))).where(filter=FieldFilter("is_done", "==", False))
    
    try:
        q = q.order_by("due_at", direction="ASCENDING")
    except Exception:
        pass  # Skip ordering if index missing
    
    docs = [d.to_dict() for d in q.offset(offset).limit(limit).stream()]
    
    # Ensure all required fields are present
    for task in docs:
        if not task.get("kind"):
            task["kind"] = "task"
        if not task.get("content"):
            task["content"] = None
        if not task.get("created_at"):
            task["created_at"] = datetime.now(timezone.utc)
        if not task.get("updated_at"):
            task["updated_at"] = task.get("created_at", datetime.now(timezone.utc))
        
        # Ensure item_id field is present
        if not task.get("item_id"):
            task["item_id"] = task.get("id")
        
        # Ensure complete item object with all required fields
        if not task.get("item"):
            # Create complete item object if missing
            task["item"] = {
                "id": task.get("id"),
                "kind": task.get("kind", "task"),
                "title": task.get("title"),
                "content": task.get("content"),
                "created_at": task.get("created_at"),
                "updated_at": task.get("updated_at")
            }
        else:
            # Ensure existing item object has all required fields
            item = task["item"]
            if not item.get("id"):
                item["id"] = task.get("id")
            if not item.get("kind"):
                item["kind"] = task.get("kind", "task")
            if not item.get("title"):
                item["title"] = task.get("title")
            if not item.get("content"):
                item["content"] = task.get("content")
            if not item.get("created_at"):
                item["created_at"] = task.get("created_at")
            if not item.get("updated_at"):
                item["updated_at"] = task.get("updated_at")
    
    return docs


def update_task(db: Client, task_id: str, payload: TaskUpdate) -> Optional[dict]:
    ref = db.collection("tasks").document(str(task_id))
    if not ref.get().exists:
        return None
    
    updates: dict = {"updated_at": datetime.now(timezone.utc)}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.content is not None:
        updates["content"] = payload.content
    if payload.due_at is not None:
        updates["due_at"] = payload.due_at
    if payload.is_done is not None:
        updates["is_done"] = payload.is_done
    
    ref.set(updates, merge=True)
    
    # Get updated task data and ensure required fields
    task_data = ref.get().to_dict()
    if task_data:
        # Ensure item_id and item fields are present
        if not task_data.get("item_id"):
            task_data["item_id"] = task_data.get("id")
        
        # Always update the associated item when task is updated
        item_id = task_data.get("item_id")
        if item_id:
            item_ref = db.collection("items").document(item_id)
            item_updates = {"updated_at": datetime.now(timezone.utc)}
            
            # Update item fields if they changed
            if payload.title is not None:
                item_updates["title"] = payload.title
            if payload.content is not None:
                item_updates["content"] = payload.content
            
            item_ref.set(item_updates, merge=True)
            
            # Get the updated item
            updated_item = item_ref.get().to_dict()
            if updated_item:
                # Ensure all required fields are present
                if "id" not in updated_item:
                    updated_item["id"] = item_id
                if "kind" not in updated_item:
                    updated_item["kind"] = "task"
                if "created_at" not in updated_item:
                    updated_item["created_at"] = task_data.get("created_at")
                if "content" not in updated_item:
                    updated_item["content"] = task_data.get("content")
                
                task_data["item"] = updated_item
            else:
                # Create complete item if it doesn't exist
                task_data["item"] = {
                    "id": item_id,
                    "kind": "task",
                    "title": task_data.get("title"),
                    "content": task_data.get("content"),
                    "created_at": task_data.get("created_at"),
                    "updated_at": task_data.get("updated_at")
                }
        else:
            # Create fallback item if no item_id
            task_data["item"] = {
                "id": task_data.get("id"),
                "kind": "task",
                "title": task_data.get("title"),
                "content": task_data.get("content"),
                "created_at": task_data.get("created_at"),
                "updated_at": task_data.get("updated_at")
            }
    
    return task_data


def toggle_task_completion(db: Client, task_id: str) -> Optional[dict]:
    ref = db.collection("tasks").document(str(task_id))
    snap = ref.get()
    if not snap.exists:
        return None
    
    data = snap.to_dict()
    new_val = not bool(data.get("is_done"))
    ref.set({"is_done": new_val, "updated_at": datetime.now(timezone.utc)}, merge=True)
    
    # Get updated task data and ensure required fields
    task_data = ref.get().to_dict()
    if task_data:
        # Ensure item_id and item fields are present
        if not task_data.get("item_id"):
            task_data["item_id"] = task_data.get("id")
        
        # Always update the associated item
        item_id = task_data.get("item_id")
        if item_id:
            item_ref = db.collection("items").document(item_id)
            item_updates = {"updated_at": datetime.now(timezone.utc)}
            item_ref.set(item_updates, merge=True)
            
            # Get the updated item
            updated_item = item_ref.get().to_dict()
            if updated_item:
                task_data["item"] = updated_item
            else:
                # Create fallback item if it doesn't exist
                task_data["item"] = {
                    "id": item_id,
                    "kind": "task",
                    "title": task_data.get("title"),
                    "content": task_data.get("content"),
                    "created_at": task_data.get("created_at"),
                    "updated_at": task_data.get("updated_at")
                }
        else:
            # Create fallback item if no item_id
            task_data["item"] = {
                "id": task_data.get("id"),
                "kind": "task",
                "title": task_data.get("title"),
                "content": task_data.get("content"),
                "created_at": task_data.get("created_at"),
                "updated_at": task_data.get("updated_at")
            }
    
    return task_data


def delete_task(db: Client, task_id: str) -> bool:
    ref = db.collection("tasks").document(str(task_id))
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def get_tasks_for_calendar(db: Client, start_date: date, end_date: date) -> list[dict]:
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    q = (
        db.collection("tasks")
        .where(filter=FieldFilter("due_at", ">=", start_datetime))
        .where(filter=FieldFilter("due_at", "<=", end_datetime))
        .order_by("due_at", direction="ASCENDING")
    )
    
    docs = [d.to_dict() for d in q.stream()]
    
    # Ensure all required fields are present
    for task in docs:
        if not task.get("kind"):
            task["kind"] = "task"
        if not task.get("content"):
            task["content"] = None
        if not task.get("created_at"):
            task["created_at"] = datetime.now(timezone.utc)
        if not task.get("updated_at"):
            task["updated_at"] = task.get("created_at", datetime.now(timezone.utc))
        
        # Ensure item_id field is present
        if not task.get("item_id"):
            task["item_id"] = task.get("id")
        
        # Ensure complete item object with all required fields
        if not task.get("item"):
            # Create complete item object if missing
            task["item"] = {
                "id": task.get("id"),
                "kind": task.get("kind", "task"),
                "title": task.get("title"),
                "content": task.get("content"),
                "created_at": task.get("created_at"),
                "updated_at": task.get("updated_at")
            }
        else:
            # Ensure existing item object has all required fields
            item = task["item"]
            if not item.get("id"):
                item["id"] = task.get("id")
            if not item.get("kind"):
                item["kind"] = task.get("kind", "task")
            if not item.get("title"):
                item["title"] = task.get("title")
            if not item.get("content"):
                item["content"] = task.get("content")
            if not item.get("created_at"):
                item["created_at"] = task.get("created_at")
            if not item.get("updated_at"):
                item["updated_at"] = task.get("updated_at")
    
    return docs
