"""Task service for managing tasks and todos."""
from __future__ import annotations

from datetime import datetime, date
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models import Item, Task
from ..schemas import TaskCreate, TaskUpdate


def create_task(db: Session, payload: TaskCreate) -> Task:
    """Create a new task."""
    item = Item(
        kind="task",
        title=payload.title,
        content=payload.content
    )
    db.add(item)
    db.flush()
    
    task = Task(
        item_id=item.id,
        due_at=payload.due_at,
        is_done=False
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(
    db: Session,
    is_done: Optional[bool] = None,
    due_date: Optional[date] = None,
    overdue: bool = False,
    limit: int = 50,
    offset: int = 0
) -> list[Task]:
    """Get tasks with optional filters."""
    query = db.query(Task).join(Item)
    
    if is_done is not None:
        query = query.filter(Task.is_done == is_done)
    
    if due_date:
        start_of_day = datetime.combine(due_date, datetime.min.time())
        end_of_day = datetime.combine(due_date, datetime.max.time())
        query = query.filter(
            and_(
                Task.due_at >= start_of_day,
                Task.due_at <= end_of_day
            )
        )
    
    if overdue:
        query = query.filter(
            and_(
                Task.due_at < datetime.utcnow(),
                Task.is_done == False
            )
        )
    
    return query.order_by(Task.due_at.asc()).offset(offset).limit(limit).all()


def update_task(db: Session, task_id: int, payload: TaskUpdate) -> Optional[Task]:
    """Update an existing task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return None
    
    # Update item fields
    if payload.title is not None:
        task.item.title = payload.title
    if payload.content is not None:
        task.item.content = payload.content
    
    # Update task fields
    if payload.due_at is not None:
        task.due_at = payload.due_at
    if payload.is_done is not None:
        task.is_done = payload.is_done
    
    task.item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


def toggle_task_completion(db: Session, task_id: int) -> Optional[Task]:
    """Toggle task completion status."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return None
    
    task.is_done = not task.is_done
    task.item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return False
    
    db.delete(task.item)  # Cascade will delete task
    db.commit()
    return True


def get_tasks_for_calendar(
    db: Session,
    start_date: date,
    end_date: date
) -> list[Task]:
    """Get tasks for calendar view within date range."""
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    return db.query(Task).join(Item).filter(
        and_(
            Task.due_at >= start_datetime,
            Task.due_at <= end_datetime
        )
    ).order_by(Task.due_at.asc()).all()
