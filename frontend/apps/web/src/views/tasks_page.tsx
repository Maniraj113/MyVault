import React, { useState, useEffect } from 'react';
import { PageHeader } from '../ui/page_header';
import { Target, Plus, Calendar, Clock, ChevronDown, ChevronRight, Archive, Edit, Trash2, ExternalLink, Eye } from 'lucide-react';
import { createTask, getTasks, toggleTask, updateItem, deleteItem } from '../service/api';

interface Task {
  id: string;
  title: string;
  content?: string;
  due_at?: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export function TasksPage(): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_at: '', due_time: '' });
  const [showArchive, setShowArchive] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const tasksData = await getTasks({ limit: 100 });
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      await toggleTask(task.id);
      await loadTasks(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      let dueDateTime = '';
      if (newTask.due_at && newTask.due_time) {
        const date = new Date(newTask.due_at + 'T' + newTask.due_time);
        dueDateTime = date.toISOString();
      } else if (newTask.due_at) {
        dueDateTime = new Date(newTask.due_at + 'T00:00:00').toISOString();
      }

      await createTask({
        title: newTask.title,
        due_at: dueDateTime || undefined
      });
      
      setNewTask({ title: '', due_at: '', due_time: '' });
      setShowForm(false);
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteItem(id);
        await loadTasks();
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditText(task.title);
    
    if (task.due_at) {
      const dueDate = new Date(task.due_at);
      setEditDueDate(dueDate.toISOString().split('T')[0]);
      setEditDueTime(dueDate.toTimeString().slice(0, 5));
    } else {
      setEditDueDate('');
      setEditDueTime('');
    }
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingTask) return;
    
    try {
      let dueDateTime = '';
      if (editDueDate && editDueTime) {
        const date = new Date(editDueDate + 'T' + editDueTime);
        dueDateTime = date.toISOString();
      } else if (editDueDate) {
        dueDateTime = new Date(editDueDate + 'T00:00:00').toISOString();
      }

      await updateItem(editingTask.id, { 
        title: editText,
        content: dueDateTime ? `Due: ${dueDateTime}` : undefined
      });
      
      setEditingTask(null);
      setEditText('');
      setEditDueDate('');
      setEditDueTime('');
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText('');
    setEditDueDate('');
    setEditDueTime('');
  };

  const addToGoogleCalendar = (task: Task) => {
    if (!task.due_at) {
      alert('Please set a due date for this task first');
      return;
    }

    const dueDate = new Date(task.due_at);
    const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.title)}&dates=${dueDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent('Task from MyVault')}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const activeTasks = tasks.filter(task => !task.is_done);
  const completedTasks = tasks.filter(task => task.is_done);

  const formatDueDateTime = (dueAt: string) => {
    const date = new Date(dueAt);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} at ${timeStr}`;
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <PageHeader 
        title="Tasks" 
        icon={<Target className="w-8 h-8 text-orange-600" />}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        }
      />

      {/* Active Tasks */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Tasks</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No active tasks</p>
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors border-gray-300 hover:border-orange-500 flex-shrink-0"
                    >
                      <Target className="w-3 h-3 text-transparent" />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingTask?.id === task.id ? (
                        <div className="space-y-2">
                          <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          />
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                              type="time"
                              value={editDueTime}
                              onChange={(e) => setEditDueTime(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={saveEdit} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                              Save
                            </button>
                            <button onClick={cancelEdit} className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900">
                            {task.title}
                          </div>
                          {task.due_at && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              Due {formatDueDateTime(task.due_at)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingTask?.id !== task.id && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => addToGoogleCalendar(task)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Add to Google Calendar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startEdit(task)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit task"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Completed Tasks Archive */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Completed Tasks ({completedTasks.length})</span>
            </div>
            {showArchive ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {showArchive && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors bg-green-500 border-green-500 text-white flex-shrink-0"
                      >
                        <Target className="w-3 h-3" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-500 line-through">
                          {task.title}
                        </div>
                        {task.due_at && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            Completed on {formatDueDateTime(task.due_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Task</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={newTask.due_at}
                  onChange={(e) => setNewTask({...newTask, due_at: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Time (Optional)
                </label>
                <input
                  type="time"
                  value={newTask.due_time}
                  onChange={(e) => setNewTask({...newTask, due_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">Time will be saved in 24-hour format but displayed in 12-hour format</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


