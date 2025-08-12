import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time?: string;
  type: 'task' | 'expense';
  amount?: number;
  category?: string;
  is_income?: boolean;
  is_done?: boolean;
}

type ViewType = 'all' | 'tasks' | 'expenses';

export function CalendarPage(): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewType, setViewType] = useState<ViewType>('all');
  const [isLoading, setIsLoading] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const response = await fetch(
        `/api/calendar/events?start_date=${startDate}&end_date=${endDate}&event_type=${viewType}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const allEvents: CalendarEvent[] = [
          ...data.tasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            date: task.date,
            time: task.time,
            type: 'task' as const,
            is_done: task.is_done
          })),
          ...data.expenses.map((expense: any) => ({
            id: expense.id,
            title: expense.title,
            date: expense.date,
            type: 'expense' as const,
            amount: expense.amount,
            category: expense.category,
            is_income: expense.is_income
          }))
        ];
        setEvents(allEvents);
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewType]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        </div>
        
        {/* View Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Events</option>
            <option value="tasks">Tasks Only</option>
            <option value="expenses">Expenses Only</option>
          </select>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-white p-3 rounded-xl shadow-sm border">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 min-h-[680px]">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b">
          {daysOfWeek.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-[110px] md:auto-rows-[120px]">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-1 border-b border-r border-gray-100 bg-gray-50"></div>;
            }

            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={index} className="p-1 border-b border-r border-gray-100 overflow-hidden">
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
                {/* Compact indicators */}
                <div className="flex gap-1 items-center">
                  {(() => {
                    const income = Number(dayEvents.filter(e => e.type === 'expense' && e.is_income).reduce((s, e) => s + Number(e.amount || 0), 0));
                    const expenseTotal = Number(dayEvents.filter(e => e.type === 'expense' && !e.is_income).reduce((s, e) => s + Number(e.amount || 0), 0));
                    return (
                      <>
                        {income > 0 && <span title={`+₹${income.toFixed(2)}`} className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>}
                        {expenseTotal > 0 && <span title={`-₹${expenseTotal.toFixed(2)}`} className="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Pending Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Completed Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-100 rounded"></div>
            <span>Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Expenses</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
