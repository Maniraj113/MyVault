# MyVault - Personal Data Management Application

A full-stack application for managing personal data including chat, expenses, tasks, and calendar events. Built with FastAPI backend and React frontend.

## Features

### 🚀 Core Features
- **WhatsApp-style Chat Interface**: Real-time messaging with conversation history
- **Expense & Income Tracking**: Categorized financial management with reporting
- **Task Management**: Create, track, and manage todos with due dates
- **Calendar View**: Unified view of tasks and expenses with filtering
- **Responsive Design**: Mobile-first design that works on all devices

### 💡 Technical Features
- **Dark Theme Sidebar**: Professional dark navigation for desktop
- **Mobile Responsive**: Native mobile app experience without scrolling issues
- **Real-time Updates**: Live data synchronization
- **RESTful API**: Comprehensive backend API with Swagger documentation
- **SQLite Database**: Lightweight, file-based database
- **Docker Support**: Container-ready for easy deployment

## Project Structure

```
MyVault/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── service/        # Business logic
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── config.py       # Configuration
│   │   └── db.py          # Database setup
│   ├── main.py            # Application entry point
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile        # Backend container
├── frontend/              # React Frontend
│   └── apps/web/
│       ├── src/
│       │   ├── views/     # Page components
│       │   ├── ui/        # UI components
│       │   ├── service/   # API client
│       │   └── main.tsx   # App entry point
│       ├── package.json   # Node dependencies
│       └── Dockerfile     # Frontend container
├── scripts/               # Utility scripts
├── documents/            # Documentation
├── docker-compose.yml    # Docker orchestration
└── cloudbuild.yaml      # Google Cloud deployment
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Setup & Run

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd MyVault
   ```

2. **Setup Backend** (Windows)
   ```bash
   scripts\setup_backend.bat
   ```

3. **Start Services** (Windows)
   ```bash
   scripts\start_services.bat
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

### Manual Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Usage Guide

### Chat Interface
- **Landing Page**: WhatsApp-style chat interface
- **Send Messages**: Type and press Enter or click Send
- **Conversation History**: All messages are saved and searchable

### Expense Management
- **Add Income/Expenses**: Click "Add Entry" button
- **Categories**: Transport, Grocery, Health, Restaurant, etc.
- **Date Picker**: Select custom dates for entries
- **Filtering**: Filter by category, type (income/expense)
- **Reporting**: View totals and category breakdowns

### Task Management
- **Create Tasks**: Add tasks with optional due dates
- **Toggle Completion**: Mark tasks as done/undone
- **Calendar Integration**: Tasks appear in calendar view
- **Filtering**: View completed, pending, or overdue tasks

### Calendar View
- **Monthly View**: See all tasks and expenses by date
- **Event Types**: Filter between tasks, expenses, or both
- **Color Coding**: Visual distinction between different event types

## API Documentation

### Authentication
Currently using basic setup. In production, implement JWT tokens.

### Main Endpoints

#### Chat API
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages` - Get messages
- `GET /api/chat/conversations` - Get conversations

#### Expenses API
- `POST /api/expenses/` - Create expense/income
- `GET /api/expenses/` - List expenses with filters
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `GET /api/expenses/categories` - Get categories
- `GET /api/expenses/report/monthly/{year}/{month}` - Monthly report

#### Tasks API
- `POST /api/tasks/` - Create task
- `GET /api/tasks/` - List tasks with filters
- `PUT /api/tasks/{id}` - Update task
- `POST /api/tasks/{id}/toggle` - Toggle completion
- `DELETE /api/tasks/{id}` - Delete task

#### Calendar API
- `GET /api/calendar/events` - Get calendar events

### Response Formats
All endpoints return JSON with consistent error handling and status codes.

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Google Cloud Run
1. Set up Google Cloud project
2. Enable Cloud Build and Cloud Run APIs
3. Run: `gcloud builds submit`

### Environment Variables
- `ENV`: Environment (local/production)
- `DATABASE_URL`: Database connection string
- `FRONTEND_ORIGIN`: Frontend URL for CORS
- `VITE_API_URL`: Backend API URL (frontend)

## Database Schema

### Tables
- **items**: Base table for all content
- **expenses**: Financial transactions
- **tasks**: Todo items
- **chat_messages**: Chat conversations

### Relationships
- One-to-one relationships between items and specific types
- Foreign key constraints with cascade delete
- Indexed fields for performance

## Development

### Code Style
- **Backend**: Python with type hints, FastAPI conventions
- **Frontend**: TypeScript, React functional components
- **Database**: SQLAlchemy ORM with Pydantic validation

### Adding Features
1. Create database model in `models.py`
2. Add Pydantic schemas in `schemas.py`
3. Implement service logic in `service/`
4. Create API endpoints in `api/`
5. Add frontend components and integrate API

### Testing
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change ports in configuration files
   - Kill existing processes

2. **Database Issues**
   - Delete `*.db` files to reset
   - Check file permissions

3. **CORS Errors**
   - Verify FRONTEND_ORIGIN environment variable
   - Check API_BASE URL in frontend

4. **Virtual Environment Issues**
   - Recreate venv: `python -m venv venv`
   - Activate and reinstall: `pip install -r requirements.txt`

### Logs
- Backend: Check uvicorn output
- Frontend: Browser console and network tab
- Docker: `docker-compose logs`

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check documentation
2. Review API docs at `/api/docs`
3. Create GitHub issue
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: December 2024