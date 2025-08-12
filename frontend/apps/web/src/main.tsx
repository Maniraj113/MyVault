import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { AppLayout } from './ui/app_layout';
import { ChatPage } from './views/chat_page';
import { InboxPage } from './views/inbox_page';
import { LinksPage } from './views/links_page';
import { NotesPage } from './views/notes_page';
import { DocsPage } from './views/docs_page';
import { HealthPage } from './views/health_page';
import { ExpensesPage } from './views/expenses_page';
import { TasksPage } from './views/tasks_page';
import { SearchPage } from './views/search_page';
import { CalendarPage } from './views/calendar_page';
import { RecentPage } from './views/recent_page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <ChatPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'inbox', element: <InboxPage /> },
      { path: 'recent', element: <RecentPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'links', element: <LinksPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'docs', element: <DocsPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'search', element: <SearchPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);


