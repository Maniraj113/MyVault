# MyVault - Setup Instructions

## ✅ All Features Implemented

### 🎯 Frontend Improvements
- ✅ **Dark Sidebar**: Left-aligned navigation with dark theme, no "Quick Access"/"More" labels
- ✅ **WhatsApp Chat**: Landing page with real-time chat interface
- ✅ **Mobile Responsive**: Native mobile app experience, no scrolling issues
- ✅ **Expense Tracking**: Income & expense with categories, date picker
- ✅ **Calendar View**: Unified tasks/expenses view with filtering

### 🎯 Backend Architecture
- ✅ **Proper Structure**: Organized in service/, api/, models with main.py at root
- ✅ **Complete CRUD APIs**: All operations for chat, expenses, tasks, calendar
- ✅ **SQLite Integration**: Normalized database with proper relationships
- ✅ **Swagger Documentation**: Comprehensive API docs at /api/docs
- ✅ **CORS Configuration**: Frontend integration ready

### 🎯 DevOps & Deployment
- ✅ **Virtual Environment**: Properly configured Python venv
- ✅ **Docker Setup**: Backend & frontend containers with docker-compose
- ✅ **Google Cloud Run**: Ready for deployment with cloudbuild.yaml
- ✅ **Scripts**: Automated setup and start scripts for Windows
- ✅ **Clean Git**: Comprehensive .gitignore file

## 🚀 Quick Start

### Option 1: Automated Setup (Windows)
```batch
# Setup backend (one-time)
scripts\setup_backend.bat

# Start both services
scripts\start_services.bat
```

### Option 2: Manual Setup
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Option 3: Docker
```bash
docker-compose up -d
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Alternative API Docs**: http://localhost:8000/api/redoc

## 📱 Features Overview

### Chat (Landing Page)
- WhatsApp-style interface
- Send/receive messages
- Conversation history
- Real-time updates

### Expenses
- Add income/expense entries
- Categories: transport, grocery, health, restaurant, etc.
- Date picker for custom dates
- Filtering and reporting
- Monthly summaries

### Tasks
- Create tasks with due dates
- Mark complete/incomplete
- Calendar integration
- Overdue task tracking

### Calendar
- Monthly view
- Task and expense events
- Color-coded by type
- Filter by event type

## 🗄️ Database Schema

```sql
-- Core items table
CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    kind VARCHAR(20), -- 'chat', 'expense', 'task'
    title VARCHAR(300),
    content TEXT,
    created_at DATETIME,
    updated_at DATETIME
);

-- Chat messages
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY,
    item_id INTEGER REFERENCES items(id),
    message TEXT,
    is_user BOOLEAN,
    conversation_id VARCHAR(100)
);

-- Expenses and income
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    item_id INTEGER REFERENCES items(id),
    amount DECIMAL(12,2),
    category VARCHAR(50),
    is_income BOOLEAN,
    occurred_on DATETIME
);

-- Tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    item_id INTEGER REFERENCES items(id),
    due_at DATETIME,
    is_done BOOLEAN
);
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
ENV=local
DATABASE_URL=sqlite:///./myvault.db
FRONTEND_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:8000/api
```

### Expense Categories
- transport
- savings
- grocery
- vegetables  
- other
- personal
- clothing
- fun
- fuel
- restaurant
- snacks
- health

## 🐳 Docker Deployment

### Local Development
```bash
docker-compose up -d
```

### Google Cloud Run
```bash
# Setup
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy
gcloud builds submit
```

## 📂 Project Structure
```
MyVault/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── service/      # Business logic  
│   │   ├── models.py     # Database models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── config.py     # Settings
│   │   └── db.py         # Database setup
│   ├── main.py           # FastAPI app
│   ├── requirements.txt  # Dependencies
│   └── Dockerfile        # Container config
├── frontend/
│   └── apps/web/
│       ├── src/
│       │   ├── views/    # Page components
│       │   ├── ui/       # UI components
│       │   └── service/  # API client
│       └── package.json
├── scripts/              # Setup scripts
├── documents/           # Documentation
└── docker-compose.yml  # Container orchestration
```

## 🔍 API Endpoints

### Chat
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages` - Get messages
- `GET /api/chat/conversations` - List conversations

### Expenses  
- `POST /api/expenses/` - Create entry
- `GET /api/expenses/` - List with filters
- `PUT /api/expenses/{id}` - Update
- `DELETE /api/expenses/{id}` - Delete
- `GET /api/expenses/categories` - Get categories
- `GET /api/expenses/report/monthly/{year}/{month}` - Reports

### Tasks
- `POST /api/tasks/` - Create task
- `GET /api/tasks/` - List with filters  
- `PUT /api/tasks/{id}` - Update
- `POST /api/tasks/{id}/toggle` - Toggle completion
- `DELETE /api/tasks/{id}` - Delete

### Calendar
- `GET /api/calendar/events` - Get events for date range

## 🎨 UI Features

### Desktop
- Dark left sidebar with larger icons
- No unnecessary "Quick Access" text
- Professional navigation
- Full-height layout

### Mobile
- Native app experience
- Bottom navigation bar
- No scrolling needed for main view
- Touch-optimized interface

### Responsive Design
- Mobile-first approach
- Proper viewport handling
- Safe area insets
- Touch-friendly controls

## ✅ Production Ready

The application is production-ready with:
- Proper error handling
- Input validation
- CORS configuration
- Health checks
- Docker containerization
- Cloud deployment setup
- Comprehensive documentation

## 🆘 Troubleshooting

### Common Issues

1. **Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Port Conflicts**
   - Backend: Change port in uvicorn command
   - Frontend: Change port in vite.config.ts

3. **Database Issues**
   - Delete *.db files to reset
   - Check write permissions

4. **CORS Errors**
   - Verify FRONTEND_ORIGIN in backend config
   - Check VITE_API_URL in frontend

Start the application and enjoy your complete personal data management system!
