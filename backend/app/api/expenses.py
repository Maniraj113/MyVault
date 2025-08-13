"""Expense API endpoints."""
from __future__ import annotations

import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Path
from google.cloud.firestore import Client

from ..firestore_db import get_db
from ..schemas import (
    ExpenseCreate, 
    ExpenseOut, 
    ExpenseUpdate, 
    ExpenseCategory,
    ExpenseReport,
    MonthlyReport
)
from ..service.expense_service import (
    create_expense,
    get_expenses,
    update_expense,
    delete_expense,
    get_expense_by_category_report,
    get_monthly_report
)

router = APIRouter()
logger = logging.getLogger("myvault.expenses")


@router.post("/", response_model=ExpenseOut, summary="Create expense or income")
def create_expense_entry(payload: ExpenseCreate) -> ExpenseOut:
    """Create a new expense or income entry."""
    try:
        with get_db() as db:
            expense = create_expense(db, payload)
            logger.info(f"Created expense: {expense.get('id')}")
            return expense
    except Exception as e:
        logger.error(f"Failed to create expense: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create expense: {str(e)}")


@router.get("/", response_model=list[ExpenseOut], summary="Get expenses")
def list_expenses(
    is_income: Optional[bool] = Query(None, description="Filter by income/expense type"),
    category: Optional[ExpenseCategory] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip")
) -> list[ExpenseOut]:
    """Get expenses with optional filters."""
    try:
        with get_db() as db:
            expenses = get_expenses(db, is_income, category, start_date, end_date, limit, offset)
            logger.info(f"Retrieved {len(expenses)} expenses")
            return expenses
    except Exception as e:
        logger.error(f"Failed to list expenses: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list expenses: {str(e)}")


@router.get("/categories", summary="Get available expense categories")
def get_expense_categories() -> list[str]:
    """Get list of available expense categories."""
    return [category.value for category in ExpenseCategory]


@router.get("/report/categories", response_model=list[ExpenseReport], summary="Get expense report by category")
def get_category_report(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter")
) -> list[ExpenseReport]:
    """Get expense report grouped by category."""
    try:
        with get_db() as db:
            report = get_expense_by_category_report(db, start_date, end_date)
            return report
    except Exception as e:
        logger.error(f"Failed to get category report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get category report: {str(e)}")


@router.get("/report/monthly/{year}/{month}", response_model=MonthlyReport, summary="Get monthly expense report")
def get_monthly_expense_report(
    year: int = Path(..., ge=2020, le=2030, description="Year"),
    month: int = Path(..., ge=1, le=12, description="Month")
) -> MonthlyReport:
    """Get monthly expense report."""
    try:
        with get_db() as db:
            report = get_monthly_report(db, year, month)
            return report
    except Exception as e:
        logger.error(f"Failed to get monthly report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get monthly report: {str(e)}")


@router.put("/{expense_id}", response_model=ExpenseOut, summary="Update expense")
def update_expense_entry(
    expense_id: str = Path(..., description="Expense ID"),
    payload: ExpenseUpdate = ...
) -> ExpenseOut:
    """Update an existing expense."""
    try:
        with get_db() as db:
            expense = update_expense(db, expense_id, payload)
            if not expense:
                raise HTTPException(status_code=404, detail="Expense not found")
            return expense
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update expense {expense_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update expense: {str(e)}")


@router.delete("/{expense_id}", summary="Delete expense")
def delete_expense_entry(
    expense_id: str = Path(..., description="Expense ID")
) -> dict:
    """Delete an expense."""
    try:
        with get_db() as db:
            success = delete_expense(db, expense_id)
            if not success:
                raise HTTPException(status_code=404, detail="Expense not found")
            logger.info(f"Deleted expense: {expense_id}")
            return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete expense {expense_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete expense: {str(e)}")
