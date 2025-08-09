"""Calendar API endpoints."""
from __future__ import annotations

from datetime import date
from typing import Literal

from fastapi import APIRouter, Query

from ..db import get_db
from ..service.task_service import get_tasks_for_calendar
from ..service.expense_service import get_expenses

router = APIRouter()


@router.get("/events", summary="Get calendar events")
def get_calendar_events(
    start_date: date = Query(..., description="Start date for calendar view"),
    end_date: date = Query(..., description="End date for calendar view"),
    event_type: Literal["tasks", "expenses", "all"] = Query("all", description="Type of events to retrieve")
) -> dict:
    """Get calendar events (tasks and/or expenses) within date range."""
    with get_db() as db:
        result = {"tasks": [], "expenses": []}
        
        if event_type in ["tasks", "all"]:
            tasks = get_tasks_for_calendar(db, start_date, end_date)
            result["tasks"] = [
                {
                    "id": task.id,
                    "title": task.item.title,
                    "date": task.due_at.date() if task.due_at else None,
                    "time": task.due_at.time() if task.due_at else None,
                    "is_done": task.is_done,
                    "type": "task"
                }
                for task in tasks
            ]
        
        if event_type in ["expenses", "all"]:
            expenses = get_expenses(
                db, 
                start_date=start_date, 
                end_date=end_date,
                limit=100  # Calendar view limit
            )
            result["expenses"] = [
                {
                    "id": expense.id,
                    "title": expense.item.title,
                    "date": expense.occurred_on.date(),
                    "amount": expense.amount,
                    "category": expense.category,
                    "is_income": expense.is_income,
                    "type": "expense"
                }
                for expense in expenses
            ]
        
        return result
