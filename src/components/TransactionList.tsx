import React, { useState, useEffect } from 'react';
import { Transaction, UserProfile, CategoryType } from '../types';
import { formatCurrency, formatIndianDate, exportToPDF, formatMonthYear } from '../utils';
import { CATEGORY_META } from './ExpenseCategoryList';
import { Search, Download, Trash2, CalendarRange, Inbox, Filter, Check, X, Pencil } from 'lucide-react';

interface TransactionListProps {
  currentUser: UserProfile;
  transactions: Transaction[];
  selectedMonth: string;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction: (tx: Transaction) => void;
}

export default function TransactionList({
  currentUser,
  transactions,
  selectedMonth,
  onDeleteTransaction,
  onUpdateTransaction,
}: TransactionListProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // States for editing a transaction
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>('Other Expenses');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Populate edit fields when selected transaction changes
  useEffect(() => {
    if (editingTx) {
      setEditTitle(editingTx.title);
      setEditAmount(editingTx.amount.toString());
      setEditCategory(editingTx.category);
      setEditDate(editingTx.date);
      setEditDescription(editingTx.description || '');
    }
  }, [editingTx]);

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

  const isEquation = /[\+\-\*\/]/.test(editAmount);
  const evaluatedAmount = evaluateMath(editAmount);

  // Filter transactions by current month, search query, and category
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  
  const filteredTransactions = monthlyTransactions.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory =
      selectedCategoryFilter === 'All' || t.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalFilteredSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(currentUser, transactions, selectedMonth);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_8px_32px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_12px_36px_rgba(0,0,0,0.4)] transition-all duration-300">
      {/* List Header and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            Spend Sheet Log
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Showing records for <span className="font-bold text-slate-700 dark:text-white">{formatMonthYear(selectedMonth)}</span>
          </p>
        </div>

        {/* Action Buttons: Export */}
        <div className="flex items-center gap-2">
          
          <button
            id="export-pdf-btn"
            onClick={handleExport}
            disabled={monthlyTransactions.length === 0 || isExporting}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl transition-all border shadow-sm cursor-pointer w-full sm:w-auto ${
              isExporting
                ? 'text-blue-400 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 cursor-wait'
                : monthlyTransactions.length > 0
                ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 hover:scale-105 active:scale-95'
                : 'text-slate-400 bg-slate-50/50 border-slate-200/50 cursor-not-allowed opacity-50'
            }`}
          >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Export PDF Statement
            </>
          )}
        </button>
      </div>
    </div>

    {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search items, notes..."
            className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          />
        </div>

        {/* Category Filter */}
        <div className="relative flex items-center w-full sm:w-auto">
          <span className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Filter className="w-3.5 h-3.5" />
          </span>
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto text-xs pl-9 pr-9 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl bg-slate-100 dark:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
          >
            <option value="All">All Categories</option>
            {Object.keys(CATEGORY_META).map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / List Container */}
      <div className="overflow-x-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-2 bg-slate-50 dark:bg-slate-950/40">
            <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">No matching transactions logged.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {filteredTransactions.map(t => {
              const meta = CATEGORY_META[t.category] || {
                icon: Inbox,
                color: 'text-slate-600',
                bg: 'bg-slate-50',
              };
              const IconComponent = meta.icon;

              return (
                <div
                  key={t.id}
                  className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-white/60 dark:border-white/10 bg-white dark:bg-slate-950/40 md:bg-white/30 md:dark:bg-slate-900/30 backdrop-blur-none md:backdrop-blur-xs hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-slate-950 md:hover:bg-white/60 md:dark:hover:bg-slate-900/60 hover:shadow-sm dark:hover:shadow-lg transition-all gap-2 sm:gap-4 shadow-[0_2px_12px_rgba(15,23,42,0.02)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Category Icon */}
                    <span className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${meta.bg}/80 dark:bg-slate-950/40 ${meta.color} dark:brightness-110 border border-white/60 dark:border-white/5`}>
                      <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    
                    {/* Name & Details */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={t.title}>
                        {t.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5" title={t.description}>
                        {t.description || t.category}
                      </p>
                    </div>
                  </div>

                  {/* Date, Price, Actions */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right">
                      {/* Indian date representation */}
                      <span className="text-[10px] font-mono bg-slate-200/60 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg font-bold">
                        {formatIndianDate(t.date)}
                      </span>
                      <p className="text-sm font-mono font-black text-slate-900 dark:text-white mt-1">
                        {formatCurrency(t.amount)}
                      </p>
                    </div>

                    {/* Actions (Edit and Delete) */}
                    {deletingId === t.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-900/50 rounded-xl p-1 animate-fade-in shrink-0">
                        <button
                          onClick={() => {
                            onDeleteTransaction(t.id);
                            setDeletingId(null);
                          }}
                          className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Confirm Delete"
                        >
                          <Check className="w-4 h-4 font-bold" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => setEditingTx(t)}
                          className="text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 sm:p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors cursor-pointer"
                          title="Edit entry"
                        >
                          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 sm:p-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer bar inside the component */}
      {filteredTransactions.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950/30 border-2 border-slate-200 dark:border-white/5 rounded-2xl p-4 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">
            Filtered Total ({filteredTransactions.length} items):
          </span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
            {formatCurrency(totalFilteredSpent)}
          </span>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/75 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-white/10 shadow-2xl dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar transition-all duration-300 scale-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/60 dark:border-white/5 bg-white/40 dark:bg-slate-950/30">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                  Edit Transaction
                </h3>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-white/60 dark:hover:bg-slate-900/60 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editTitle.trim() || !editAmount) return;
                
                const evaluated = evaluateMath(editAmount);
                const parsedAmount = evaluated !== null ? evaluated : parseFloat(editAmount);
                
                if (isNaN(parsedAmount) || parsedAmount <= 0) return;
                
                await onUpdateTransaction({
                  ...editingTx,
                  title: editTitle.trim(),
                  amount: Number(parsedAmount.toFixed(2)),
                  category: editCategory,
                  date: editDate,
                  description: editDescription.trim() || undefined,
                });
                
                setEditingTx(null);
              }}
              className="p-6 space-y-4 text-left"
            >
              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Expense Item Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Jio Fiber Bill, Swiggy Dinner"
                  className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
                />
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
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0.00 (or e.g. 150+45)"
                      className="w-full text-sm pl-8 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
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
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as CategoryType)}
                    className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xs cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
                  >
                    {Object.keys(CATEGORY_META).map((catKey) => (
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
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xs cursor-pointer font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Short Note <span className="text-slate-300 dark:text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="e.g. Paid via UPI"
                    className="w-full text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/40 dark:bg-slate-900/30 font-bold text-slate-800 dark:text-slate-200 focus:bg-white/90 dark:focus:bg-slate-900/90 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-white/65 dark:hover:bg-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xs rounded-xl border border-slate-200/60 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
