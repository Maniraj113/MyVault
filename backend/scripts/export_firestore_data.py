#!/usr/bin/env python3
"""
Firestore Data Export Script
Exports data from Firestore collections to JSON/CSV for analysis
"""

import json
import csv
import os
import sys
from datetime import datetime
from typing import Dict, List, Any
import logging
from pathlib import Path

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.firestore_db import get_db

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FirestoreDataExporter:
    def __init__(self, export_dir: str = "exports"):
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(exist_ok=True)
        self.db = get_db()
        
    def export_collection_to_json(self, collection_name: str, filename: str = None):
        """Export a Firestore collection to JSON"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{collection_name}_{timestamp}.json"
        
        filepath = self.export_dir / filename
        
        logger.info(f"Exporting collection '{collection_name}' to {filepath}")
        
        try:
            with self.db() as db:
                # Get all documents from collection
                docs = db.collection(collection_name).stream()
                
                data = []
                for doc in docs:
                    doc_data = doc.to_dict()
                    doc_data['_id'] = doc.id  # Add document ID
                    data.append(doc_data)
                
                # Write to JSON file
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, default=str, ensure_ascii=False)
                
                logger.info(f"Exported {len(data)} documents to {filepath}")
                return filepath
                
        except Exception as e:
            logger.error(f"Failed to export collection '{collection_name}': {e}")
            raise
    
    def export_collection_to_csv(self, collection_name: str, filename: str = None):
        """Export a Firestore collection to CSV"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{collection_name}_{timestamp}.csv"
        
        filepath = self.export_dir / filename
        
        logger.info(f"Exporting collection '{collection_name}' to {filepath}")
        
        try:
            with self.db() as db:
                # Get all documents from collection
                docs = db.collection(collection_name).stream()
                
                data = []
                fieldnames = set()
                
                # First pass: collect all data and find all field names
                for doc in docs:
                    doc_data = doc.to_dict()
                    doc_data['_id'] = doc.id
                    data.append(doc_data)
                    fieldnames.update(doc_data.keys())
                
                # Convert to list and sort for consistent column order
                fieldnames = sorted(list(fieldnames))
                
                # Write to CSV file
                with open(filepath, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for row in data:
                        # Ensure all fields are present (fill missing with empty string)
                        row_with_all_fields = {field: row.get(field, '') for field in fieldnames}
                        writer.writerow(row_with_all_fields)
                
                logger.info(f"Exported {len(data)} documents to {filepath}")
                return filepath
                
        except Exception as e:
            logger.error(f"Failed to export collection '{collection_name}': {e}")
            raise
    
    def export_expenses_for_analysis(self):
        """Export expenses with enhanced analysis fields"""
        logger.info("Exporting expenses for analysis...")
        
        try:
            with self.db() as db:
                # Get all expenses
                expenses = db.collection("expenses").stream()
                
                analysis_data = []
                for expense in expenses:
                    expense_data = expense.to_dict()
                    
                    # Parse content field if it's JSON
                    content = {}
                    if expense_data.get('content'):
                        try:
                            content = json.loads(expense_data['content'])
                        except:
                            content = {}
                    
                    # Create analysis-friendly record
                    analysis_record = {
                        'id': expense.id,
                        'title': expense_data.get('title', ''),
                        'amount': expense_data.get('amount', 0),
                        'category': expense_data.get('category', ''),
                        'is_income': expense_data.get('is_income', False),
                        'occurred_on': expense_data.get('occurred_on', ''),
                        'created_at': expense_data.get('created_at', ''),
                        'updated_at': expense_data.get('updated_at', ''),
                        'original_id': content.get('original_id', ''),
                        'account': content.get('account', ''),
                        'sign': content.get('sign', ''),
                        'time': content.get('time', ''),
                        'confirmed': content.get('confirmed', False),
                        'transfer': content.get('transfer', False),
                        'date_idx': content.get('date_idx', ''),
                        'migrated_from': content.get('migrated_from', ''),
                        'migrated_at': content.get('migrated_at', '')
                    }
                    
                    analysis_data.append(analysis_record)
                
                # Export to both JSON and CSV
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                
                json_file = self.export_dir / f"expenses_analysis_{timestamp}.json"
                csv_file = self.export_dir / f"expenses_analysis_{timestamp}.csv"
                
                # Write JSON
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(analysis_data, f, indent=2, default=str, ensure_ascii=False)
                
                # Write CSV
                if analysis_data:
                    fieldnames = analysis_data[0].keys()
                    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                        writer = csv.DictWriter(f, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerows(analysis_data)
                
                logger.info(f"Exported {len(analysis_data)} expenses for analysis")
                logger.info(f"JSON: {json_file}")
                logger.info(f"CSV: {csv_file}")
                
                return json_file, csv_file
                
        except Exception as e:
            logger.error(f"Failed to export expenses for analysis: {e}")
            raise
    
    def export_all_collections(self):
        """Export all main collections"""
        collections = [
            'expenses',
            'tasks', 
            'chat',
            'files',
            'items',
            'migration_logs'
        ]
        
        exported_files = []
        
        for collection in collections:
            try:
                json_file = self.export_collection_to_json(collection)
                csv_file = self.export_collection_to_csv(collection)
                exported_files.extend([json_file, csv_file])
                
            except Exception as e:
                logger.warning(f"Failed to export collection '{collection}': {e}")
                continue
        
        logger.info(f"Export completed. Files saved to: {self.export_dir}")
        return exported_files
    
    def create_export_summary(self):
        """Create a summary of all exported data"""
        summary = {
            "export_date": datetime.now().isoformat(),
            "export_directory": str(self.export_dir.absolute()),
            "collections_exported": [],
            "total_records": 0,
            "file_formats": ["JSON", "CSV"]
        }
        
        try:
            with self.db() as db:
                # Get collection stats
                collections = ['expenses', 'tasks', 'chat', 'files', 'items']
                
                for collection in collections:
                    try:
                        count = len(list(db.collection(collection).stream()))
                        summary["collections_exported"].append({
                            "name": collection,
                            "record_count": count
                        })
                        summary["total_records"] += count
                    except:
                        continue
                
                # Write summary
                summary_file = self.export_dir / f"export_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                with open(summary_file, 'w', encoding='utf-8') as f:
                    json.dump(summary, f, indent=2, default=str)
                
                logger.info(f"Export summary created: {summary_file}")
                return summary_file
                
        except Exception as e:
            logger.error(f"Failed to create export summary: {e}")
            raise

def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python export_firestore_data.py all                    # Export all collections")
        print("  python export_firestore_data.py expenses               # Export expenses only")
        print("  python export_firestore_data.py analysis               # Export expenses for analysis")
        print("  python export_firestore_data.py collection <name>      # Export specific collection")
        sys.exit(1)
    
    exporter = FirestoreDataExporter()
    
    try:
        if sys.argv[1] == "all":
            exporter.export_all_collections()
            exporter.create_export_summary()
            
        elif sys.argv[1] == "expenses":
            exporter.export_collection_to_json("expenses")
            exporter.export_collection_to_csv("expenses")
            
        elif sys.argv[1] == "analysis":
            exporter.export_expenses_for_analysis()
            
        elif sys.argv[1] == "collection" and len(sys.argv) == 3:
            collection_name = sys.argv[2]
            exporter.export_collection_to_json(collection_name)
            exporter.export_collection_to_csv(collection_name)
            
        else:
            print("Invalid command. Use 'all', 'expenses', 'analysis', or 'collection <name>'")
            sys.exit(1)
        
        print(f"Export completed successfully! Files saved to: {exporter.export_dir}")
        
    except Exception as e:
        print(f"Export failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

