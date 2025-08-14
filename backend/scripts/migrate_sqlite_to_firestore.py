#!/usr/bin/env python3
"""
SQLite to Firestore Migration Script
Migrates financial data from SQLite to Firestore collections
"""

import sqlite3
import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any
import logging

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore_db import get_db
from app.schemas import ExpenseCreate, TaskCreate, ItemCreate

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SQLiteToFirestoreMigrator:
    def __init__(self, sqlite_path: str):
        self.sqlite_path = sqlite_path
        self.db = get_db()
        
    def connect_sqlite(self):
        """Connect to SQLite database"""
        try:
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row  # Enable dict-like access
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to SQLite: {e}")
            raise
    
    def migrate_movements_to_expenses(self):
        """Migrate table_movements to expenses collection"""
        logger.info("Starting migration of movements to expenses...")
        
        conn = self.connect_sqlite()
        cursor = conn.cursor()
        
        try:
            # Get all movements
            cursor.execute("""
                SELECT _id, account, category, amount, sign, detail, date, time, 
                       confirmed, transfer, date_idx, picture, iso_code
                FROM table_movements 
                ORDER BY date_idx
            """)
            
            movements = cursor.fetchall()
            logger.info(f"Found {len(movements)} movements to migrate")
            
            migrated_count = 0
            for movement in movements:
                try:
                    # Parse date and time
                    date_str = movement['date']
                    time_str = movement['time']
                    
                    # Convert DD/MM/YYYY to ISO format
                    if date_str and '/' in date_str:
                        day, month, year = date_str.split('/')
                        date_iso = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    else:
                        date_iso = datetime.now().isoformat()
                    
                    # Create expense record
                    expense_data = {
                        "title": movement['detail'] or f"{movement['category']} - {movement['amount']}",
                        "amount": abs(float(movement['amount'])),
                        "category": movement['category'] or "other",
                        "is_income": movement['sign'] == "+",
                        "occurred_on": date_iso,
                        "content": json.dumps({
                            "original_id": movement['_id'],
                            "account": movement['account'],
                            "sign": movement['sign'],
                            "time": time_str,
                            "confirmed": bool(movement['confirmed']),
                            "transfer": bool(movement['transfer']),
                            "date_idx": movement['date_idx'],
                            "picture": movement['picture'],
                            "iso_code": movement['iso_code'],
                            "migrated_from": "sqlite",
                            "migrated_at": datetime.now().isoformat()
                        })
                    }
                    
                    # Create expense in Firestore
                    with self.db() as db:
                        from app.service.expense_service import create_expense
                        expense = create_expense(db, expense_data)
                        logger.info(f"Migrated expense: {expense.get('id')} - {expense_data['title']}")
                    
                    migrated_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to migrate movement {movement['_id']}: {e}")
                    continue
            
            logger.info(f"Successfully migrated {migrated_count} expenses")
            
        finally:
            conn.close()
    
    def migrate_currencies_to_items(self):
        """Migrate table_currencies to items collection"""
        logger.info("Starting migration of currencies to items...")
        
        conn = self.connect_sqlite()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM table_currencies")
            currencies = cursor.fetchall()
            logger.info(f"Found {len(currencies)} currencies to migrate")
            
            migrated_count = 0
            for currency in currencies:
                try:
                    item_data = {
                        "kind": "currency",
                        "title": f"Currency: {currency.get('code', 'Unknown')}",
                        "content": json.dumps({
                            "code": currency.get('code'),
                            "name": currency.get('name'),
                            "symbol": currency.get('symbol'),
                            "rate": currency.get('rate'),
                            "migrated_from": "sqlite",
                            "migrated_at": datetime.now().isoformat()
                        })
                    }
                    
                    with self.db() as db:
                        from app.service.expense_service import create_expense
                        item = create_expense(db, item_data)
                        logger.info(f"Migrated currency: {item.get('id')} - {item_data['title']}")
                    
                    migrated_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to migrate currency {currency.get('_id')}: {e}")
                    continue
            
            logger.info(f"Successfully migrated {migrated_count} currencies")
            
        finally:
            conn.close()
    
    def create_migration_log(self):
        """Create a migration log entry"""
        migration_log = {
            "migration_date": datetime.now().isoformat(),
            "source_database": self.sqlite_path,
            "tables_migrated": ["table_movements", "table_currencies"],
            "status": "completed"
        }
        
        with self.db() as db:
            db.collection("migration_logs").add(migration_log)
            logger.info("Migration log created")
    
    def run_migration(self):
        """Run the complete migration"""
        logger.info("Starting SQLite to Firestore migration...")
        
        try:
            # Migrate data
            self.migrate_movements_to_expenses()
            self.migrate_currencies_to_items()
            
            # Create migration log
            self.create_migration_log()
            
            logger.info("Migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise

def main():
    if len(sys.argv) != 2:
        print("Usage: python migrate_sqlite_to_firestore.py <path_to_sqlite_file>")
        sys.exit(1)
    
    sqlite_path = sys.argv[1]
    
    if not os.path.exists(sqlite_path):
        print(f"SQLite file not found: {sqlite_path}")
        sys.exit(1)
    
    try:
        migrator = SQLiteToFirestoreMigrator(sqlite_path)
        migrator.run_migration()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

