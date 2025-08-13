"""Expense service refactored to Firestore."""
from __future__ import annotations

import logging
from datetime import datetime, date, timezone
from typing import Optional
from calendar import monthrange

from google.cloud.firestore import Client, FieldFilter

from ..schemas import ExpenseCreate, ExpenseUpdate, ExpenseReport, MonthlyReport

logger = logging.getLogger("myvault.expense_service")


def create_expense(db: Client, payload: ExpenseCreate) -> dict:
    now = datetime.now(timezone.utc)
    item_ref = db.collection("items").document()
    expense_ref = db.collection("expenses").document()

    item_doc = {
        "id": item_ref.id,
        "kind": "expense",
        "title": payload.title,
        "content": payload.content,
        "created_at": now,
        "updated_at": now,
    }
    expense_doc = {
        "id": expense_ref.id,
        "item_id": item_ref.id,
        "title": payload.title,
        "amount": float(payload.amount),
        "category": payload.category.value if hasattr(payload.category, "value") else str(payload.category),
        "is_income": bool(payload.is_income),
        "occurred_on": payload.occurred_on or now,
        "created_at": now,
        "updated_at": now,
        "item": item_doc,
    }

    batch = db.batch()
    batch.set(item_ref, item_doc)
    batch.set(expense_ref, expense_doc)
    batch.commit()

    expense_doc["item"] = item_doc
    return expense_doc


def get_expenses(
    db: Client,
    is_income: Optional[bool] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    from google.cloud import firestore

    q = db.collection("expenses")
    if is_income is not None:
        q = q.where(filter=FieldFilter("is_income", "==", is_income))
    if category:
        q = q.where(filter=FieldFilter("category", "==", category))
    if start_date:
        q = q.where(filter=FieldFilter("occurred_on", ">=", datetime.combine(start_date, datetime.min.time())))
    if end_date:
        q = q.where(filter=FieldFilter("occurred_on", "<=", datetime.combine(end_date, datetime.max.time())))
    try:
        q = q.order_by("occurred_on", direction="DESCENDING")
    except Exception:
        pass  # Skip ordering if index missing
    docs = [d.to_dict() for d in q.offset(offset).limit(limit).stream()]
    # Ensure embedded item is complete for response schema
    for e in docs:
        item = e.get("item") or {}
        if not item or not all(k in item for k in ("kind", "content", "created_at", "updated_at")):
            item_id = e.get("item_id")
            if item_id:
                snap = db.collection("items").document(str(item_id)).get()
                if snap.exists:
                    e["item"] = snap.to_dict()
    return docs


def update_expense(db: Client, expense_id: str, payload: ExpenseUpdate) -> Optional[dict]:
    ref = db.collection("expenses").document(str(expense_id))
    snap = ref.get()
    if not snap.exists:
        return None
    updates: dict = {"updated_at": datetime.now(timezone.utc)}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.content is not None:
        updates.setdefault("item", {})["content"] = payload.content
    if payload.amount is not None:
        updates["amount"] = float(payload.amount)
    if payload.category is not None:
        updates["category"] = payload.category.value if hasattr(payload.category, "value") else str(payload.category)
    if payload.is_income is not None:
        updates["is_income"] = bool(payload.is_income)
    if payload.occurred_on is not None:
        updates["occurred_on"] = payload.occurred_on
    ref.set(updates, merge=True)
    result = ref.get().to_dict()
    # Fill item from items collection if needed
    if result is not None:
        item = result.get("item") or {}
        if not item or not all(k in item for k in ("kind", "content", "created_at", "updated_at")):
            item_id = result.get("item_id")
            if item_id:
                snap = db.collection("items").document(str(item_id)).get()
                if snap.exists:
                    result["item"] = snap.to_dict()
    return result


def delete_expense(db: Client, expense_id: str) -> bool:
    ref = db.collection("expenses").document(str(expense_id))
    if not ref.get().exists:
        return False
    ref.delete()
    return True


def get_expense_by_category_report(
    db: Client,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> list[ExpenseReport]:
    items = get_expenses(db, None, None, start_date, end_date, limit=5000, offset=0)
    agg: dict[tuple[str, bool], dict] = {}
    for e in items:
        key = (e.get("category"), bool(e.get("is_income")))
        cur = agg.setdefault(key, {"category": key[0], "is_income": key[1], "total_amount": 0.0, "count": 0})
        cur["total_amount"] += float(e.get("amount", 0) or 0)
        cur["count"] += 1
    return [ExpenseReport(**a) for a in agg.values()]


def get_monthly_report(db: Client, year: int, month: int) -> MonthlyReport:
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)
    items = get_expenses(db, None, None, start_date, end_date, limit=5000, offset=0)
    income_total = sum(float(e.get("amount", 0) or 0) for e in items if e.get("is_income"))
    expense_total = sum(float(e.get("amount", 0) or 0) for e in items if not e.get("is_income"))
    category_report = get_expense_by_category_report(db, start_date, end_date)
    return MonthlyReport(
        month=f"{year}-{month:02d}",
        total_income=float(income_total),
        total_expense=float(expense_total),
        net_amount=float(income_total) - float(expense_total),
        expense_by_category=category_report,
    )
