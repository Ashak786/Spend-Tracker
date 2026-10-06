import React, { useState, useEffect } from 'react';
import { CategoryType, Transaction, BudgetBucket, IncomeSource } from '../types';
import { CATEGORY_META } from './ExpenseCategoryList';
import { PlusCircle, Calendar, IndianRupee, Tag, FileText, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency, getCurrentDateKey, getCurrentMonthKey, getDefaultBudgetBucket } from '../utils';

interface TransactionFormProps {
  userId: string;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onSuccess?: () => void;
  selectedMonth: string; // fallback to prefill date month
  isModal?: boolean;
  incomes?: IncomeSource[];
  transactions?: Transaction[];
  preselectedIncomeId?: string | null;
}

export default function TransactionForm({
  userId,
  onAddTransaction,
  onSuccess,
  selectedMonth,
  isModal = false,
  incomes = [],
  transactions = [],
  preselectedIncomeId,
}: TransactionFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food & Groceries');
  const [budgetBucket, setBudgetBucket] = useState<BudgetBucket>(getDefaultBudgetBucket('Food & Groceries'));
  const [incomeSourceId, setIncomeSourceId] = useState<string>(preselectedIncomeId || 'salary');

  useEffect(() => {
    if (preselectedIncomeId) {
      setIncomeSourceId(preselectedIncomeId);
    }
  }, [preselectedIncomeId]);
  
  // Set default date to today or the selectedMonth's first day
  const getTodayDateString = () => {
    const currentMonthStr = getCurrentMonthKey();
    if (currentMonthStr === selectedMonth) {
      return getCurrentDateKey();
    } else {
      return `${selectedMonth}-01`;
    }
  };

  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState('');

  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    setBudgetBucket(getDefaultBudgetBucket(newCat));
  };

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
      budgetBucket,
      incomeSourceId: incomeSourceId === 'salary' ? undefined : incomeSourceId,
      date,
      description: description.trim() || undefined,
    });

    onSuccess?.();

    // Reset fields (preserve date and category for convenient batch entry)
    setTitle('');
    setAmount('');
    setDescription('');
  };

  // Find currently selected income source info
  const selectedIncomeObj = incomes.find(inc => inc.id === incomeSourceId);
  const selectedIncomeSpent = selectedIncomeObj
    ? transactions.filter(t => t.incomeSourceId === selectedIncomeObj.id).reduce((sum, t) => sum + t.amount, 0)
    : 0;
  const selectedIncomeRemaining = selectedIncomeObj ? selectedIncomeObj.amount - selectedIncomeSpent : 0;
  const parsedCurrentAmount = evaluatedAmount !== null ? evaluatedAmount : parseFloat(amount);
  const isOverIncomeBalance = selectedIncomeObj && !isNaN(parsedCurrentAmount) && parsedCurrentAmount > selectedIncomeRemaining;

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
            className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
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
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              placeholder="0.00 (or e.g. 150+45)"
              className="w-full text-base md:text-sm pl-8 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
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
            onChange={e => handleCategoryChange(e.target.value as CategoryType)}
            className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          >
            {Object.keys(CATEGORY_META).map(catKey => (
              <option key={catKey} value={catKey}>
                {catKey}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Funded From / Income Source Dropdown (Only shown when recording from an Inflow stream) */}
      {incomes && incomes.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Funded From / Income Source</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              {incomeSourceId === 'salary' ? 'Base Salary Ledger' : 'Specific Inflow Stream'}
            </span>
          </label>
          <select
            value={incomeSourceId}
            onChange={e => setIncomeSourceId(e.target.value)}
            className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-100 dark:bg-slate-900/60 cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          >
            <option value="salary">💼 Monthly Base Salary (Default Ledger)</option>
            {incomes.map(inc => {
              const spent = transactions.filter(t => t.incomeSourceId === inc.id).reduce((sum, t) => sum + t.amount, 0);
              const rem = inc.amount - spent;
              return (
                <option key={inc.id} value={inc.id}>
                  💰 {inc.sourceName} — {formatCurrency(rem)} available (Total: {formatCurrency(inc.amount)})
                </option>
              );
            })}
          </select>
          
          {/* Helper preview info */}
          {selectedIncomeObj && (
            <div className={`mt-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-between gap-2 ${
              isOverIncomeBalance 
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50'
            }`}>
              <span className="flex items-center gap-1">
                {isOverIncomeBalance ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Wallet className="w-3.5 h-3.5 shrink-0" />}
                <span>
                  Using money from <strong className="font-bold">{selectedIncomeObj.sourceName}</strong>
                </span>
              </span>
              <span className="font-bold shrink-0">
                {formatCurrency(selectedIncomeRemaining)} remaining
              </span>
            </div>
          )}
        </div>
      )}

      {/* Manual 50/30/20 Budget Bucket Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
          <span>50 / 30 / 20 Budget Allocation</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Select Category Bucket</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setBudgetBucket('Needs')}
            className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              budgetBucket === 'Needs'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <span>🏠 50% Needs</span>
            <span className="text-[9px] font-medium opacity-80">Rent & Bills</span>
          </button>

          <button
            type="button"
            onClick={() => setBudgetBucket('Wants')}
            className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              budgetBucket === 'Wants'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <span>🛍️ 30% Wants</span>
            <span className="text-[9px] font-medium opacity-80">Shopping</span>
          </button>

          <button
            type="button"
            onClick={() => setBudgetBucket('Savings')}
            className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              budgetBucket === 'Savings'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <span>📈 20% Savings</span>
            <span className="text-[9px] font-medium opacity-80">Investments</span>
          </button>

          <button
            type="button"
            onClick={() => setBudgetBucket('None')}
            className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              budgetBucket === 'None'
                ? 'bg-slate-700 text-white border-slate-700 shadow-md scale-[1.02] dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-white/10 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <span>💳 Normal Entry</span>
            <span className="text-[9px] font-medium opacity-80">No 50/30/20 Split</span>
          </button>
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
            className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
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
            className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-transform md:hover:scale-[1.01] shadow-md cursor-pointer"
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
