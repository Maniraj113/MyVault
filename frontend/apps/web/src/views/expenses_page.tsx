import React, { useEffect, useState,  useRef, useCallback } from 'react';
import { createExpense as apiCreateExpense, getExpenses as apiGetExpenses, updateExpense as apiUpdateExpense, deleteExpense as apiDeleteExpense } from '../service/api';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown,  
  Filter,
  Car, 
  PiggyBank, 
  ShoppingCart, 
  Carrot, 
  MoreHorizontal, 
  User, 
  Shirt, 
  Gamepad2, 
  Zap, 
  Utensils, 
  Cookie, 
  Heart, 
  ChevronDown,
  Edit,
  X,
  HelpCircle,
  Trash2
} from 'lucide-react';

interface Expense {
  id: number;
  item_id: number;
  title: string;
  amount: number;
  category: string;
  is_income: boolean;
  occurred_on: string;
}

interface ExpenseForm {
  title: string;
  amount: string;
  category: string;
  is_income: boolean;
  occurred_on: string;
  occurred_time: string;
}

const EXPENSE_CATEGORIES = [
  { value: '', label: '-- Select Category --', icon: null },
  { value: 'salary', label: 'Salary', icon: TrendingUp },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'savings', label: 'Savings', icon: PiggyBank },
  { value: 'grocery', label: 'Grocery', icon: ShoppingCart },
  { value: 'vegetables', label: 'Vegetables', icon: Carrot },
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'clothing', label: 'Clothing', icon: Shirt },
  { value: 'fun', label: 'Fun', icon: Gamepad2 },
  { value: 'fuel', label: 'Fuel', icon: Zap },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'snacks', label: 'Snacks', icon: Cookie },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'other', label: 'Other', icon: HelpCircle }
];

export function ExpensesPage(): JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showCategory, setShowCategory] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  
  const now = new Date();
  const [form, setForm] = useState<ExpenseForm>({
    title: '',
    amount: '',
    category: '', // Start with empty category
    is_income: false,
    occurred_on: now.toISOString().split('T')[0],
    occurred_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      .replace(' ', '')
      .toLowerCase(),
  });

  useEffect(() => {
    if (editingExpense) {
      const occurred = new Date(editingExpense.occurred_on);
      setForm({
        title: editingExpense.title,
        amount: String(editingExpense.amount),
        category: editingExpense.category,
        is_income: editingExpense.is_income,
        occurred_on: occurred.toISOString().split('T')[0],
        occurred_time: occurred.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          .replace(' ', '')
          .toLowerCase(),
      });
      setShowForm(true);
    } else {
      const now = new Date();
      setForm({
        title: '',
        amount: '',
        category: '',
        is_income: false,
        occurred_on: now.toISOString().split('T')[0],
        occurred_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          .replace(' ', '')
          .toLowerCase(),
      });
    }
  }, [editingExpense]);

  function formatToISO(dateStr: string, time12h: string): string {
    // Expect time like "01:23pm"; return a LOCAL naive ISO-like string without timezone
    const match = time12h.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (!match) return `${dateStr}T00:00:00`;
    let [_, hh, mm, mer] = match;
    let hour = parseInt(hh, 10);
    if (mer === 'pm' && hour !== 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;
    const hourStr = String(hour).padStart(2, '0');
    const time24 = `${hourStr}:${mm}:00`;
    // Do NOT call toISOString() which converts to UTC and shifts time
    return `${dateStr}T${time24}`;
  }

  const getTimeParts = useCallback((time12h: string): { hour: string; minute: string; mer: 'am' | 'pm' } => {
    const m = time12h.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (!m) return { hour: '12', minute: '00', mer: 'am' };
    return { hour: m[1].padStart(2, '0'), minute: m[2], mer: m[3] as 'am' | 'pm' };
  }, []);

  const setTimePart = useCallback((part: 'hour' | 'minute' | 'mer', value: string): void => {
    const { hour, minute, mer } = getTimeParts(form.occurred_time);
    const next = {
      hour: part === 'hour' ? value.padStart(2, '0') : hour,
      minute: part === 'minute' ? value.padStart(2, '0') : minute,
      mer: (part === 'mer' ? value : mer) as 'am' | 'pm',
    };
    setForm({ ...form, occurred_time: `${next.hour}:${next.minute}${next.mer}` });
  }, [form.occurred_time]);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterType === 'income') params.is_income = true;
      if (filterType === 'expense') params.is_income = false;
      
      // Add month filter
      if (filterMonth) {
        const [year, month] = filterMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        params.start_date = startDate;
        params.end_date = endDate;
      }
      
      const data = await apiGetExpenses(params);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterCategory, filterType, filterMonth]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.amount || parseFloat(form.amount) <= 0 || !form.category) {
      setError('Please fill in all required fields including category selection');
      return;
    }

    try {
      const payload = {
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        is_income: form.is_income,
        occurred_on: formatToISO(form.occurred_on, form.occurred_time)
      } as const;

      if (editingExpense) {
        await apiUpdateExpense(String(editingExpense.id), payload);
        setSuccess('Expense updated successfully!');
      } else {
        await apiCreateExpense(payload);
        setSuccess('Expense created successfully!');
      }

      setEditingExpense(null);
      setShowForm(false);
      // Reset form to default values
      const now = new Date();
      setForm({
        title: '',
        amount: '',
        category: '',
        is_income: false,
        occurred_on: now.toISOString().split('T')[0],
        occurred_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          .replace(' ', '')
          .toLowerCase(),
      });
      loadExpenses();

    } catch (error) {
      console.error('Failed to save expense:', error);
      setError('Failed to save expense. Please try again.');
    }
  }, [form, editingExpense, loadExpenses]);

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await apiDeleteExpense(String(id));
      setSuccess('Expense deleted successfully!');
      setDeleteConfirmId(null);
      loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      setError('Failed to delete expense. Please try again.');
    }
  }, [loadExpenses]);

  const totalIncome = expenses
    .filter(e => e.is_income)
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpense = expenses
    .filter(e => !e.is_income)
    .reduce((sum, e) => sum + e.amount, 0);

  // Close category dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategory(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-green-50 p-2 sm:p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-1 sm:gap-2 text-green-700">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Total Income</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-900">₹{totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="bg-red-50 p-2 sm:p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-1 sm:gap-2 text-red-700">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Total Expenses</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-900">₹{totalExpense.toFixed(2)}</p>
        </div>
        
        <div className="bg-blue-50 p-2 sm:p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-1 sm:gap-2 text-blue-700">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Net Balance</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-900">₹{(totalIncome - totalExpense).toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Month/Year Filter - First Priority */}
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[140px]"
            />
            {filterMonth !== new Date().toISOString().slice(0, 7) && (
              <button
                onClick={() => setFilterMonth(new Date().toISOString().slice(0, 7))}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              >
                Reset
              </button>
            )}
          </div>

          {/* Hide type and category filters on very small screens */}
          <div className="hidden sm:flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[120px]"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            {/* Category Filter - Second Priority */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[140px]"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Show only essential filters on mobile */}
          <div className="sm:hidden flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[100px]"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-auto h-full">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Wallet className="w-12 h-12 mb-2 text-gray-300" />
              <p>No expenses found</p>
              <p className="text-sm">Add your first entry to get started</p>
            </div>
          ) : (
            <>
              {/* Table for md+ */}
              <table className="hidden md:table w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Date & Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                    const IconComponent = category?.icon || MoreHorizontal;
                    return (
                      <React.Fragment key={expense.id}>
                        <tr>
                          <td className="px-4 py-3 text-left">
                            <div className="flex items-center gap-3">
                              <div 
                                className={`h-8 w-8 rounded-md grid place-items-center flex-shrink-0 ${
                                  expense.is_income ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{expense.title}</div>
                                <div className="text-xs text-gray-500">{category?.label || expense.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {new Date(expense.occurred_on).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">
                            {new Date(expense.occurred_on).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${expense.is_income ? 'text-green-600' : 'text-red-600'}`}>
                            {expense.is_income ? '+' : '-'}₹{Number(expense.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => handleEdit(expense)} className="p-1 text-gray-400 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirmId(expense.id)} className="p-1 text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        
                        {/* Delete Confirmation */}
                        {deleteConfirmId === expense.id && (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 bg-red-50 border-t border-red-200">
                              <div className="text-sm text-red-800 mb-2">
                                Are you sure you want to delete this expense?
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDelete(expense.id)}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {/* Cards for mobile */}
              <ul className="md:hidden divide-y">
                {expenses.map((expense) => {
                  const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                  const IconComponent = category?.icon || MoreHorizontal;
                  return (
                    <li key={expense.id} className="p-3 flex items-center gap-3">
                      <div 
                        className={`h-10 w-10 rounded-md grid place-items-center flex-shrink-0 ${
                          expense.is_income ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}
                        onClick={() => handleEdit(expense)}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => handleEdit(expense)}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 truncate">{expense.title}</div>
                          <div className={`ml-3 font-semibold ${expense.is_income ? 'text-emerald-600' : 'text-red-600'}`}>
                            {expense.is_income ? '+' : '-'}₹{Number(expense.amount).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>{new Date(expense.occurred_on).toLocaleDateString()}</span>
                          <span>{new Date(expense.occurred_on).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{category?.label || expense.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(expense)} 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(expense.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Mobile Delete Confirmation */}
                      {deleteConfirmId === expense.id && (
                        <li className="p-3 bg-red-50 border-t border-red-200">
                          <div className="text-sm text-red-800 mb-2">
                            Are you sure you want to delete this expense?
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </li>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{editingExpense ? 'Edit Entry' : 'Add New Entry'}</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingExpense(null);
                  // Reset form to default values
                  const now = new Date();
                  setForm({
                    title: '',
                    amount: '',
                    category: '',
                    is_income: false,
                    occurred_on: now.toISOString().split('T')[0],
                    occurred_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                      .replace(' ', '')
                      .toLowerCase(),
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({...form, is_income: false})}
                      className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                        !form.is_income 
                          ? 'bg-red-100 border-red-300 text-red-700' 
                          : 'bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({...form, is_income: true})}
                      className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                        form.is_income 
                          ? 'bg-green-100 border-green-300 text-green-700' 
                          : 'bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                {/* Amount First */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Date & Time Second */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.occurred_on}
                      onChange={(e) => setForm({...form, occurred_on: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={(() => { const {hour, minute, mer} = getTimeParts(form.occurred_time); const h = (mer==='pm'? ((parseInt(hour)%12)+12): (hour==='12'? '00': hour)).toString().padStart(2,'0'); return `${h}:${minute}`; })()}
                      onChange={(e) => {
                        const [h24, m] = e.target.value.split(':');
                        const hNum = parseInt(h24, 10);
                        const mer = hNum >= 12 ? 'pm' : 'am';
                        const h12 = String(((hNum + 11) % 12) + 1).padStart(2, '0');
                        setForm({ ...form, occurred_time: `${h12}:${m}${mer}` });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="relative" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      onClick={() => setShowCategory(!showCategory)}
                    >
                      <span className="flex items-center gap-2">
                        {form.category && (() => { 
                          const Cat = EXPENSE_CATEGORIES.find(c => c.value === form.category)?.icon; 
                          return Cat ? <Cat className="w-5 h-5 text-gray-600" /> : null; 
                        })()}
                        {EXPENSE_CATEGORIES.find(c => c.value === form.category)?.label || '-- Select Category --'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCategory ? 'rotate-180' : ''}`} />
                    </button>
                    {showCategory && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                        <div className="p-2">
                          {EXPENSE_CATEGORIES.map(category => (
                            <button
                              key={category.value}
                              type="button"
                              onClick={() => { 
                                setForm({...form, category: category.value}); 
                                setShowCategory(false); 
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 rounded text-sm transition-colors ${
                                form.category === category.value 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'text-gray-700'
                              } ${category.value === '' ? 'text-gray-400 italic' : ''}`}
                            >
                              {category.icon && <category.icon className={`w-4 h-4 ${category.value === '' ? 'text-gray-400' : 'text-gray-600'}`} />}
                              <span className={category.value === '' ? 'italic' : ''}>{category.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title Last */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder="e.g., Coffee, Salary, Groceries"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                      // Reset form to default values
                      const now = new Date();
                      setForm({
                        title: '',
                        amount: '',
                        category: '',
                        is_income: false,
                        occurred_on: now.toISOString().split('T')[0],
                        occurred_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                          .replace(' ', '')
                          .toLowerCase(),
                      });
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    {editingExpense ? 'Update Entry' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}