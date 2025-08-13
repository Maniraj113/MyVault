"""Task API endpoints."""
from __future__ import annotations

import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Path
from google.cloud.firestore import Client

from ..firestore_db import get_db
from ..schemas import TaskCreate, TaskOut, TaskUpdate
from ..service.task_service import (
    create_task,
    get_tasks,
    update_task,
    toggle_task_completion,
    delete_task,
    get_tasks_for_calendar
)

router = APIRouter()
logger = logging.getLogger("myvault.tasks")


@router.post("/", response_model=TaskOut, summary="Create task")
def create_task_entry(payload: TaskCreate) -> TaskOut:
    """Create a new task."""
    try:
        with get_db() as db:
            task = create_task(db, payload)
            logger.info(f"Created task: {task.get('id')}")
            return task
    except Exception as e:
        logger.error(f"Failed to create task: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")


@router.get("/", response_model=list[TaskOut], summary="Get tasks")
def list_tasks(
    is_done: Optional[bool] = Query(None, description="Filter by completion status"),
    due_date: Optional[date] = Query(None, description="Filter by due date"),
    overdue: bool = Query(False, description="Show only overdue tasks"),
    limit: int = Query(50, ge=1, le=100, description="Number of tasks to return"),
    offset: int = Query(0, ge=0, description="Number of tasks to skip")
) -> list[TaskOut]:
    """Get tasks with optional filters."""
    try:
        with get_db() as db:
            tasks = get_tasks(db, is_done, due_date, overdue, limit, offset)
            logger.info(f"Retrieved {len(tasks)} tasks")
            return tasks
    except Exception as e:
        logger.error(f"Failed to list tasks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list tasks: {str(e)}")


@router.get("/calendar", response_model=list[TaskOut], summary="Get tasks for calendar")
def get_calendar_tasks(
    start_date: date = Query(..., description="Start date for calendar view"),
    end_date: date = Query(..., description="End date for calendar view")
) -> list[TaskOut]:
    """Get tasks for calendar view within date range."""
    try:
        with get_db() as db:
            tasks = get_tasks_for_calendar(db, start_date, end_date)
            return tasks
    except Exception as e:
        logger.error(f"Failed to get calendar tasks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get calendar tasks: {str(e)}")


@router.put("/{task_id}", response_model=TaskOut, summary="Update task")
def update_task_entry(
    task_id: str = Path(..., description="Task ID"),
    payload: TaskUpdate = ...
) -> TaskOut:
    """Update an existing task."""
    try:
        with get_db() as db:
            task = update_task(db, task_id, payload)
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
            return task
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update task {task_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")


@router.post("/{task_id}/toggle", response_model=TaskOut, summary="Toggle task completion")
def toggle_task(
    task_id: str = Path(..., description="Task ID")
) -> TaskOut:
    """Toggle task completion status."""
    try:
        with get_db() as db:
            task = toggle_task_completion(db, task_id)
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
            return task
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle task {task_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to toggle task: {str(e)}")


@router.delete("/{task_id}", summary="Delete task")
def delete_task_entry(
    task_id: str = Path(..., description="Task ID")
) -> dict:
    """Delete a task."""
    try:
        with get_db() as db:
            success = delete_task(db, task_id)
            if not success:
                raise HTTPException(status_code=404, detail="Task not found")
            logger.info(f"Deleted task: {task_id}")
            return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete task {task_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")
