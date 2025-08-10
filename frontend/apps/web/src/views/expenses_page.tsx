import React, { useEffect, useState, Fragment } from 'react';
import { createExpense as apiCreateExpense } from '../service/api';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
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
  ChevronDown
} from 'lucide-react';

interface Expense {
  id: number;
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
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'savings', label: 'Savings', icon: PiggyBank },
  { value: 'grocery', label: 'Grocery', icon: ShoppingCart },
  { value: 'vegetables', label: 'Vegetables', icon: Carrot },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'clothing', label: 'Clothing', icon: Shirt },
  { value: 'fun', label: 'Fun', icon: Gamepad2 },
  { value: 'fuel', label: 'Fuel', icon: Zap },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'snacks', label: 'Snacks', icon: Cookie },
  { value: 'health', label: 'Health', icon: Heart }
];

export function ExpensesPage(): JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const now = new Date();
  const [form, setForm] = useState<ExpenseForm>({
    title: '',
    amount: '',
    category: 'other',
    is_income: false,
    occurred_on: now.toISOString().split('T')[0],
    occurred_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      .replace(' ', '')
      .toLowerCase(),
  });

  function formatToISO(dateStr: string, time12h: string): string {
    // Expect time like "01:23pm" or "01:23 am" (we normalize to no space, lowercase above)
    const match = time12h.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (!match) return new Date(`${dateStr}T00:00:00`).toISOString();
    let [_, hh, mm, mer] = match;
    let hour = parseInt(hh, 10);
    if (mer === 'pm' && hour !== 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;
    const hourStr = String(hour).padStart(2, '0');
    const time24 = `${hourStr}:${mm}:00`;
    return new Date(`${dateStr}T${time24}`).toISOString();
  }

  function getTimeParts(time12h: string): { hour: string; minute: string; mer: 'am' | 'pm' } {
    const m = time12h.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (!m) return { hour: '12', minute: '00', mer: 'am' };
    return { hour: m[1].padStart(2, '0'), minute: m[2], mer: m[3] as 'am' | 'pm' };
  }

  function setTimePart(part: 'hour' | 'minute' | 'mer', value: string): void {
    const { hour, minute, mer } = getTimeParts(form.occurred_time);
    const next = {
      hour: part === 'hour' ? value.padStart(2, '0') : hour,
      minute: part === 'minute' ? value.padStart(2, '0') : minute,
      mer: (part === 'mer' ? value : mer) as 'am' | 'pm',
    };
    setForm({ ...form, occurred_time: `${next.hour}:${next.minute}${next.mer}` });
  }

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterType === 'income') params.append('is_income', 'true');
      if (filterType === 'expense') params.append('is_income', 'false');
      
      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [filterCategory, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.amount || parseFloat(form.amount) <= 0) {
      alert('Please fill in all required fields with valid values');
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

      const saved = await apiCreateExpense(payload);
      if (saved) {
        const d = new Date();
        setForm({
          title: '',
          amount: '',
          category: 'other',
          is_income: false,
          occurred_on: d.toISOString().split('T')[0],
          occurred_time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            .replace(' ', '')
            .toLowerCase(),
        });
        setShowForm(false);
        loadExpenses();
      } else {
        alert('Failed to save expense');
      }
    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Failed to save expense');
    }
  };

  const totalIncome = expenses
    .filter(e => e.is_income)
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpense = expenses
    .filter(e => !e.is_income)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-green-900">₹{totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-900">₹{totalExpense.toFixed(2)}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium">Net Balance</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">₹{(totalIncome - totalExpense).toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Types</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
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
        <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
                {expenses.map((expense) => {
                  const category = EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                  const IconComponent = category?.icon || MoreHorizontal;
                  
                  return (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        <div>{new Date(expense.occurred_on).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(expense.occurred_on).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{expense.title}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-gray-500" />
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {category?.label || expense.category}
                          </span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        expense.is_income ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {expense.is_income ? '+' : '-'}₹{expense.amount.toFixed(2)}
                </td>
              </tr>
                  );
                })}
          </tbody>
        </table>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md m-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Entry</h2>
            
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                    onClick={() => setShowCategory(true)}
                  >
                    <span className="flex items-center gap-2">
                      {(() => { const Cat = EXPENSE_CATEGORIES.find(c => c.value === form.category)?.icon || MoreHorizontal; return <Cat className="w-5 h-5 text-gray-600" />; })()}
                      {EXPENSE_CATEGORIES.find(c => c.value === form.category)?.label || 'Select'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {showCategory && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                      {EXPENSE_CATEGORIES.map(category => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => { setForm({...form, category: category.value}); setShowCategory(false); }}
                          className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${form.category === category.value ? 'bg-gray-50' : ''}`}
                        >
                          <category.icon className="w-5 h-5 text-gray-700" />
                          <span>{category.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  Save Entry
        </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}