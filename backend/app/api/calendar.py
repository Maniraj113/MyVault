"""Calendar API endpoints."""
from __future__ import annotations

import logging
from datetime import date
from typing import Literal

from fastapi import APIRouter, Query, HTTPException

from ..firestore_db import get_db
from ..service.task_service import get_tasks_for_calendar
from ..service.expense_service import get_expenses

router = APIRouter()
logger = logging.getLogger("myvault.calendar")


@router.get("/events", summary="Get calendar events")
def get_calendar_events(
    start_date: date = Query(..., description="Start date for calendar view"),
    end_date: date = Query(..., description="End date for calendar view"),
    event_type: Literal["tasks", "expenses", "all"] = Query("all", description="Type of events to retrieve")
) -> dict:
    """Get calendar events (tasks and/or expenses) within date range."""
    try:
        with get_db() as db:
            result = {"tasks": [], "expenses": []}
            
            if event_type in ["tasks", "all"]:
                try:
                    tasks = get_tasks_for_calendar(db, start_date, end_date)
                    result["tasks"] = [
                        {
                            "id": t.get("id"),
                            "title": (t.get("item") or {}).get("title"),
                            "date": (t.get("due_at").date() if t.get("due_at") else None),
                            "time": (t.get("due_at").time() if t.get("due_at") else None),
                            "is_done": t.get("is_done"),
                            "type": "task",
                        }
                        for t in tasks
                    ]
                except Exception as e:
                    logger.warning(f"Failed to get tasks for calendar: {str(e)}")
                    result["tasks"] = []
            
            if event_type in ["expenses", "all"]:
                try:
                    expenses = get_expenses(
                        db, 
                        start_date=start_date, 
                        end_date=end_date,
                        limit=100  # Calendar view limit
                    )
                    result["expenses"] = [
                        {
                            "id": e.get("id"),
                            "title": (e.get("item") or {}).get("title"),
                            "date": e.get("occurred_on").date() if e.get("occurred_on") else None,
                            "amount": e.get("amount"),
                            "category": e.get("category"),
                            "is_income": e.get("is_income"),
                            "type": "expense",
                        }
                        for e in expenses
                    ]
                except Exception as e:
                    logger.warning(f"Failed to get expenses for calendar: {str(e)}")
                    result["expenses"] = []
            
            logger.info(f"Calendar events: {len(result['tasks'])} tasks, {len(result['expenses'])} expenses")
            return result
    except Exception as e:
        logger.error(f"Failed to get calendar events: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get calendar events: {str(e)}")
