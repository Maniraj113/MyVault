import React, { useState, useEffect } from 'react';
import { PageHeader } from '../ui/page_header';
import { Target, Plus, Calendar, Clock, ChevronDown, ChevronRight, Archive, Edit, Trash2, ExternalLink, Eye, Check, X } from 'lucide-react';
import { createTask, getTasks, toggleTask, updateTask, deleteTask } from '../service/api';

interface Task {
  id: string;
  title: string;
  content?: string;
  due_at?: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
  item?: {
    title: string;
  };
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      setSuccess('Task created successfully!');
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      setError('Failed to create task. Please try again.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      setSuccess('Task deleted successfully!');
      setDeleteConfirmId(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditText(task.item?.title || task.title || '');
    
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

      await updateTask(editingTask.id, { 
        title: editText,
        due_at: dueDateTime || undefined
      });
      
      setEditingTask(null);
      setEditText('');
      setEditDueDate('');
      setEditDueTime('');
      setSuccess('Task updated successfully!');
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('Failed to update task. Please try again.');
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
      setError('Please set a due date for this task first');
      return;
    }

    const dueDate = new Date(task.due_at);
    const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(task.item?.title || task.title || 'Untitled Task')}&dates=${dueDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent('Task from MyVault')}`;
    
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
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium">{success}</span>
            <button 
              onClick={() => setSuccess(null)} 
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
                        <div className="space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            rows={3}
                            placeholder="Enter task title..."
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                              type="time"
                              value={editDueTime}
                              onChange={(e) => setEditDueTime(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={saveEdit} 
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Save
                            </button>
                            <button 
                              onClick={cancelEdit} 
                              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900">
                            {task.item?.title || task.title || 'Untitled Task'}
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
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => addToGoogleCalendar(task)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-all"
                        title="Add to Google Calendar"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => startEdit(task)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-all"
                        title="Edit task"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(task.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {/* Delete Confirmation */}
                  {deleteConfirmId === task.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800 mb-3">
                        Are you sure you want to delete this task?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
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
                        onClick={() => handleDeleteTask(task.id)}
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

      {/* Task Creation Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
              <textarea
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_at}
                  onChange={(e) => setNewTask({ ...newTask, due_at: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Time</label>
                <input
                  type="time"
                  value={newTask.due_time}
                  onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={addTask}
                disabled={!newTask.title.trim()}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Create Task
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


