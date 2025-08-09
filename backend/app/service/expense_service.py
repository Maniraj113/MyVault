"""Expense service for managing income and expenses."""
from __future__ import annotations

from datetime import datetime, date
from typing import Optional
from calendar import monthrange

from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_

from ..models import Item, Expense, ExpenseCategory
from ..schemas import ExpenseCreate, ExpenseUpdate, ExpenseReport, MonthlyReport


def create_expense(db: Session, payload: ExpenseCreate) -> Expense:
    """Create a new expense or income entry."""
    item = Item(
        kind="expense",
        title=payload.title,
        content=payload.content
    )
    db.add(item)
    db.flush()
    
    expense = Expense(
        item_id=item.id,
        amount=payload.amount,
        category=payload.category,
        is_income=payload.is_income,
        occurred_on=payload.occurred_on or datetime.utcnow()
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_expenses(
    db: Session,
    is_income: Optional[bool] = None,
    category: Optional[ExpenseCategory] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 50,
    offset: int = 0
) -> list[Expense]:
    """Get expenses with optional filters."""
    query = db.query(Expense).join(Item)
    
    if is_income is not None:
        query = query.filter(Expense.is_income == is_income)
    
    if category:
        query = query.filter(Expense.category == category)
    
    if start_date:
        query = query.filter(Expense.occurred_on >= start_date)
    
    if end_date:
        query = query.filter(Expense.occurred_on <= end_date)
    
    return query.order_by(Expense.occurred_on.desc()).offset(offset).limit(limit).all()


def update_expense(db: Session, expense_id: int, payload: ExpenseUpdate) -> Optional[Expense]:
    """Update an existing expense."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        return None
    
    # Update item fields
    if payload.title is not None:
        expense.item.title = payload.title
    if payload.content is not None:
        expense.item.content = payload.content
    
    # Update expense fields
    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.category is not None:
        expense.category = payload.category
    if payload.is_income is not None:
        expense.is_income = payload.is_income
    if payload.occurred_on is not None:
        expense.occurred_on = payload.occurred_on
    
    expense.item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: int) -> bool:
    """Delete an expense."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        return False
    
    db.delete(expense.item)  # Cascade will delete expense
    db.commit()
    return True


def get_expense_by_category_report(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> list[ExpenseReport]:
    """Get expense report grouped by category."""
    query = db.query(
        Expense.category,
        Expense.is_income,
        func.sum(Expense.amount).label("total_amount"),
        func.count(Expense.id).label("count")
    ).group_by(Expense.category, Expense.is_income)
    
    if start_date:
        query = query.filter(Expense.occurred_on >= start_date)
    
    if end_date:
        query = query.filter(Expense.occurred_on <= end_date)
    
    results = query.all()
    
    return [
        ExpenseReport(
            category=result.category,
            total_amount=float(result.total_amount),
            count=result.count,
            is_income=result.is_income
        )
        for result in results
    ]


def get_monthly_report(db: Session, year: int, month: int) -> MonthlyReport:
    """Get monthly expense report."""
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)
    
    # Get totals
    income_total = db.query(func.sum(Expense.amount)).filter(
        and_(
            Expense.is_income == True,
            Expense.occurred_on >= start_date,
            Expense.occurred_on <= end_date
        )
    ).scalar() or 0
    
    expense_total = db.query(func.sum(Expense.amount)).filter(
        and_(
            Expense.is_income == False,
            Expense.occurred_on >= start_date,
            Expense.occurred_on <= end_date
        )
    ).scalar() or 0
    
    # Get category breakdown
    category_report = get_expense_by_category_report(db, start_date, end_date)
    
    return MonthlyReport(
        month=f"{year}-{month:02d}",
        total_income=float(income_total),
        total_expense=float(expense_total),
        net_amount=float(income_total) - float(expense_total),
        expense_by_category=category_report
    )
