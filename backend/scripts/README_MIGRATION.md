# 🔄 SQLite to Firestore Migration & Export Guide

This guide explains how to migrate your SQLite financial data to Firestore and export data for analysis with Claude MCP.

## 📋 Prerequisites

1. **SQLite Database File**: Your financial data in SQLite format
2. **Firebase Project**: Set up and configured
3. **Python Environment**: With required dependencies
4. **Firebase Credentials**: Properly configured in `backend/credentials/`

## 🚀 Migration Process

### Step 1: Prepare Your SQLite File

Ensure your SQLite file contains the expected tables:
- `table_movements` - Financial transactions
- `table_currencies` - Currency information

### Step 2: Run Migration

#### Option A: Using Batch Script (Windows)
```bash
cd backend/scripts
run_migration.bat "C:\path\to\your\database.db"
```

#### Option B: Using Python Directly
```bash
cd backend/scripts
python migrate_sqlite_to_firestore.py "path/to/your/database.db"
```

### Step 3: Verify Migration

1. Check your MyVault application
2. Navigate to Expenses section
3. You should see all your migrated transactions

## 📊 Data Export for Analysis

### Export All Collections
```bash
cd backend/scripts
python export_firestore_data.py all
```

### Export Expenses Only (for financial analysis)
```bash
python export_firestore_data.py expenses
```

### Export Expenses with Enhanced Analysis Fields
```bash
python export_firestore_data.py analysis
```

### Export Specific Collection
```bash
python export_firestore_data.py collection expenses
```

## 📁 Export Output

Exports are saved to the `exports/` directory with timestamps:

```
exports/
├── expenses_20241214_143022.json
├── expenses_20241214_143022.csv
├── expenses_analysis_20241214_143022.json
├── expenses_analysis_20241214_143022.csv
├── export_summary_20241214_143022.json
└── ...
```

## 🔍 Analysis with Claude MCP

### 1. Download Export Files
The export scripts create both JSON and CSV files that you can download to your local machine.

### 2. Connect with Claude MCP
Use the CSV files for analysis:
- **expenses_analysis_*.csv** - Best for financial analysis
- **expenses_*.csv** - Raw expense data
- **export_summary_*.json** - Overview of all collections

### 3. Sample Analysis Queries
```sql
-- Find top spending categories
SELECT category, SUM(amount) as total_spent 
FROM expenses 
WHERE is_income = false 
GROUP BY category 
ORDER BY total_spent DESC;

-- Monthly spending trends
SELECT 
  SUBSTR(occurred_on, 1, 7) as month,
  SUM(amount) as total_spent
FROM expenses 
WHERE is_income = false 
GROUP BY month 
ORDER BY month;

-- Income vs Expenses
SELECT 
  is_income,
  SUM(amount) as total,
  COUNT(*) as count
FROM expenses 
GROUP BY is_income;
```

## 🗂️ Data Structure Mapping

### SQLite → Firestore Mapping

| SQLite Field | Firestore Field | Notes |
|--------------|-----------------|-------|
| `_id` | `original_id` | Preserved in content |
| `account` | `account` | Stored in content |
| `category` | `category` | Direct mapping |
| `amount` | `amount` | Absolute value |
| `sign` | `is_income` | + = income, - = expense |
| `detail` | `title` | Transaction description |
| `date` | `occurred_on` | Converted to ISO format |
| `time` | `time` | Stored in content |
| `confirmed` | `confirmed` | Boolean conversion |
| `transfer` | `transfer` | Boolean conversion |
| `date_idx` | `date_idx` | Preserved in content |
| `picture` | `picture` | Stored in content |
| `iso_code` | `iso_code` | Stored in content |

## ⚠️ Important Notes

1. **Data Preservation**: Original SQLite IDs are preserved in the `content` field
2. **Date Format**: Dates are converted from DD/MM/YYYY to ISO format (YYYY-MM-DD)
3. **Amount Handling**: Signs are converted to boolean `is_income` field
4. **Migration Log**: All migrations are logged in `migration_logs` collection

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**: Check Firebase credentials and permissions
2. **Missing Data**: Verify SQLite file path and table names
3. **Date Parsing**: Ensure dates are in DD/MM/YYYY format

### Debug Mode

Add logging to see detailed migration progress:
```python
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Cost Analysis

### Migration Costs
- **One-time**: Minimal (only during migration)
- **Storage**: ~$0.026 per GB/month
- **Reads**: ~$0.18 per 100K reads
- **Writes**: ~$0.06 per 100K writes

### Estimated Monthly Costs (1000 transactions)
- **Storage**: $0.001/month
- **Reads (100 views)**: $0.00018/month
- **Total**: **Under $0.01/month**

## 🎯 Next Steps

1. **Run Migration**: Use the provided scripts
2. **Verify Data**: Check your MyVault application
3. **Export for Analysis**: Use export scripts for Claude MCP
4. **Monitor Usage**: Check Firebase console for costs

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your Firebase configuration
3. Ensure your SQLite file is accessible
4. Check the migration logs in Firestore

---

**Happy migrating! 🚀**

