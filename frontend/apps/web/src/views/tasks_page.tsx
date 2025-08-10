import React, { useState, useEffect } from 'react';
import { PageHeader } from '../ui/page_header';
import { CheckSquare, Plus, Calendar, Clock } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  due_at?: string;
  is_done: boolean;
}

export function TasksPage(): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due_at: '' });

  useEffect(() => {
    // Load tasks from API
    // For now, using dummy data
    setTasks([
      { id: 1, title: 'Renew insurance', due_at: '2024-08-15', is_done: false },
      { id: 2, title: 'Pay rent', due_at: '2024-09-01', is_done: false },
      { id: 3, title: 'Review budget', due_at: '', is_done: true }
    ]);
  }, []);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, is_done: !task.is_done } : task
    ));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Date.now(),
      title: newTask.title,
      due_at: newTask.due_at || undefined,
      is_done: false
    };
    
    setTasks([...tasks, task]);
    setNewTask({ title: '', due_at: '' });
    setShowForm(false);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <PageHeader 
        title="Tasks" 
        icon={<CheckSquare className="w-8 h-8 text-amber-600" />}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        }
      />

      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  task.is_done
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.is_done
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-amber-500'
                    }`}
                  >
                    {task.is_done && <CheckSquare className="w-3 h-3" />}
                  </button>
            <div>
                    <div className={`font-medium ${task.is_done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </div>
                    {task.due_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Due {new Date(task.due_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
            </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No tasks yet</p>
                <p className="text-sm">Add your first task to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
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
                  placeholder="e.g., Review monthly budget"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ title, actionLabel }: { title: string; actionLabel?: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      {actionLabel && (
        <button className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}


