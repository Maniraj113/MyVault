import React, { useEffect, useState } from 'react';
import { Plus, Wallet, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';

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
}

const EXPENSE_CATEGORIES = [
  'transport',
  'savings', 
  'grocery',
  'vegetables',
  'other',
  'personal',
  'clothing',
  'fun',
  'fuel',
  'restaurant',
  'snacks',
  'health'
];

export function ExpensesPage(): JSX.Element {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState<ExpenseForm>({
    title: '',
    amount: '',
    category: 'other',
    is_income: false,
    occurred_on: new Date().toISOString().split('T')[0]
  });

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
      const response = await fetch('/api/expenses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title,
          amount: parseFloat(form.amount),
          category: form.category,
          is_income: form.is_income,
          occurred_on: new Date(form.occurred_on).toISOString()
        }),
      });

      if (response.ok) {
        setForm({
          title: '',
          amount: '',
          category: 'other',
          is_income: false,
          occurred_on: new Date().toISOString().split('T')[0]
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
          <p className="text-2xl font-bold text-green-900">${totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-900">${totalExpense.toFixed(2)}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium">Net Balance</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">${(totalIncome - totalExpense).toFixed(2)}</p>
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
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
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
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(expense.occurred_on).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{expense.title}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      expense.is_income ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {expense.is_income ? '+' : '-'}${expense.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
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
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {EXPENSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

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