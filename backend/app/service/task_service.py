"""Task service refactored to Firestore."""
from __future__ import annotations

from datetime import datetime, date, timezone
from typing import Optional

from google.cloud.firestore import Client, FieldFilter

from ..schemas import TaskCreate, TaskUpdate


def create_task(db: Client, payload: TaskCreate) -> dict:
    now = datetime.now(timezone.utc)
    item_ref = db.collection("items").document()
    task_ref = db.collection("tasks").document()
    item_doc = {
        "id": item_ref.id,
        "kind": "task",
        "title": payload.title,
        "content": payload.content,
        "created_at": now,
        "updated_at": now,
    }
    task_doc = {
        "id": task_ref.id,
        "item_id": item_ref.id,
        "due_at": payload.due_at,
        "is_done": False,
        "created_at": now,
        "updated_at": now,
        "item": {"id": item_ref.id, "title": payload.title},
    }
    batch = db.batch()
    batch.set(item_ref, item_doc)
    batch.set(task_ref, task_doc)
    batch.commit()
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
    
    return [d.to_dict() for d in q.offset(offset).limit(limit).stream()]


def update_task(db: Client, task_id: str, payload: TaskUpdate) -> Optional[dict]:
    ref = db.collection("tasks").document(str(task_id))
    if not ref.get().exists:
        return None
    updates: dict = {"updated_at": datetime.now(timezone.utc)}
    if payload.title is not None:
        updates.setdefault("item", {})["title"] = payload.title
    if payload.content is not None:
        updates.setdefault("item", {})["content"] = payload.content
    if payload.due_at is not None:
        updates["due_at"] = payload.due_at
    if payload.is_done is not None:
        updates["is_done"] = payload.is_done
    ref.set(updates, merge=True)
    return ref.get().to_dict()


def toggle_task_completion(db: Client, task_id: str) -> Optional[dict]:
    ref = db.collection("tasks").document(str(task_id))
    snap = ref.get()
    if not snap.exists:
        return None
    data = snap.to_dict()
    new_val = not bool(data.get("is_done"))
    ref.set({"is_done": new_val, "updated_at": datetime.now(timezone.utc)}, merge=True)
    return ref.get().to_dict()


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
    return [d.to_dict() for d in q.stream()]
