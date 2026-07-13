import React, { useState } from 'react';
import { CategoryType, Transaction } from '../types';
import { CATEGORY_META } from './ExpenseCategoryList';
import { PlusCircle, Calendar, IndianRupee, Tag, FileText } from 'lucide-react';
import { formatCurrency } from '../utils';

interface TransactionFormProps {
  userId: string;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onSuccess?: () => void;
  selectedMonth: string; // fallback to prefill date month
  isModal?: boolean;
}

export default function TransactionForm({
  userId,
  onAddTransaction,
  onSuccess,
  selectedMonth,
  isModal = false,
}: TransactionFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food & Groceries');
  
  // Set default date to today or the selectedMonth's first day
  const getTodayDateString = () => {
    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
    if (currentMonthStr === selectedMonth) {
      return today.toISOString().slice(0, 10); // YYYY-MM-DD
    } else {
      return `${selectedMonth}-01`;
    }
  };

  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');

  // Helper to parse/evaluate basic math safely
  const evaluateMath = (val: string): number | null => {
    const clean = val.replace(/\s+/g, '');
    if (!clean) return null;
    // Strict pattern matching: only allow digits, arithmetic operators (+ - * /), decimal points, and parentheses
    if (!/^[0-9+\-*/().]+$/.test(clean)) return null;
    try {
      // Safe dynamic evaluation since pattern is fully validated
      const result = new Function(`return (${clean})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
    } catch {
      // Ignore evaluation errors during typing
    }
    return null;
  };

  const isEquation = /[\+\-\*\/]/.test(amount);
  const evaluatedAmount = evaluateMath(amount);

  const handleAmountBlur = () => {
    if (isEquation && evaluatedAmount !== null) {
      setAmount(Number(evaluatedAmount.toFixed(2)).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !date) return;
    
    const evaluated = evaluateMath(amount);
    const parsedAmount = evaluated !== null ? evaluated : parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      userId,
      title: title.trim(),
      amount: Number(parsedAmount.toFixed(2)),
      category,
      date,
      description: description.trim() || undefined,
    });

    onSuccess?.();

    // Reset fields (preserve date and category for convenient batch entry)
    setTitle('');
    setAmount('');
    setDescription('');
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Field */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
          Expense Item Title
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Jio Fiber Bill, Swiggy Dinner"
            className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          />
        </div>
      </div>

      {/* Row for Amount and Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex justify-between items-center">
            <span>Amount (INR)</span>
            {isEquation && evaluatedAmount !== null && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Math Mode</span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-black">₹</span>
            <input
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              placeholder="0.00 (or e.g. 150+45)"
              className="w-full text-sm pl-8 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
            />
          </div>
          {isEquation && (
            <div className="mt-1.5 min-h-[1.25rem] flex items-center">
              {evaluatedAmount !== null ? (
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-black tracking-wide flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="text-slate-400 dark:text-slate-500 font-bold">=</span> {formatCurrency(evaluatedAmount)}
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-medium italic">
                  Type a complete formula...
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as CategoryType)}
            className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          >
            {Object.keys(CATEGORY_META).map(catKey => (
              <option key={catKey} value={catKey}>
                {catKey}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row for Date and Optional Description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Date of Expense
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            Short Note / Description <span className="text-slate-300 dark:text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Paid via UPI"
            className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-transform hover:scale-[1.01] shadow-md cursor-pointer"
      >
        Add to Spend Sheet
      </button>
    </form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 shadow-[0_8px_32px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.4)] transition-all duration-300">
      <div className="flex items-center gap-2 mb-5">
        <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Record New Expense
        </h2>
      </div>
      {formContent}
    </div>
  );
}
