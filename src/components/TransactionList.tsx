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
    <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm">
      {/* List Header and Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-teal-600 animate-pulse" />
            Spend Sheet Log
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Showing records for <span className="font-bold text-slate-700">{formatMonthYear(selectedMonth)}</span>
          </p>
        </div>

        {/* Export Button */}
        <button
          id="export-pdf-btn"
          onClick={handleExport}
          disabled={monthlyTransactions.length === 0 || isExporting}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl transition-all border-2 shadow-sm cursor-pointer w-full sm:w-auto ${
            isExporting
              ? 'text-teal-400 bg-teal-50/50 border-teal-100 cursor-wait'
              : monthlyTransactions.length > 0
              ? 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100 hover:scale-105 active:scale-95'
              : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed opacity-50'
          }`}
        >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24">
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search items, notes..."
            className="w-full text-xs pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-bold text-slate-800"
          />
        </div>

        {/* Category Filter */}
        <div className="relative flex items-center w-full sm:w-auto">
          <span className="absolute left-4 text-slate-400 pointer-events-none">
            <Filter className="w-3.5 h-3.5" />
          </span>
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto text-xs pl-9 pr-9 py-2.5 border-2 border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer font-bold text-slate-800"
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
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-2">
            <Inbox className="w-8 h-8 text-slate-300" />
            <p className="text-xs text-slate-400 font-semibold">No matching transactions logged.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
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
                  className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 transition-all gap-2 sm:gap-4 shadow-xs"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Category Icon */}
                    <span className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${meta.bg} ${meta.color} border border-slate-200/40`}>
                      <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    
                    {/* Name & Details */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate" title={t.title}>
                        {t.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold truncate mt-0.5" title={t.description}>
                        {t.description || t.category}
                      </p>
                    </div>
                  </div>

                  {/* Date, Price, Actions */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right">
                      {/* Indian date representation */}
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg font-bold">
                        {formatIndianDate(t.date)}
                      </span>
                      <p className="text-sm font-mono font-black text-slate-900 mt-1">
                        {formatCurrency(t.amount)}
                      </p>
                    </div>

                    {/* Actions (Edit and Delete) */}
                    {deletingId === t.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl p-1 animate-fade-in shrink-0">
                        <button
                          onClick={() => {
                            onDeleteTransaction(t.id);
                            setDeletingId(null);
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Confirm Delete"
                        >
                          <Check className="w-4 h-4 font-bold" />
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => setEditingTx(t)}
                          className="text-slate-300 hover:text-teal-600 p-1.5 sm:p-2 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit entry"
                        >
                          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 sm:p-2 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500">
            Filtered Total ({filteredTransactions.length} items):
          </span>
          <span className="font-mono font-black text-slate-900 text-sm">
            {formatCurrency(totalFilteredSpent)}
          </span>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden transition-transform duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-teal-600 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
                  Edit Transaction
                </h3>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editTitle.trim() || !editAmount || isNaN(Number(editAmount))) return;
                
                onUpdateTransaction({
                  ...editingTx,
                  title: editTitle.trim(),
                  amount: Number(editAmount),
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
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Expense Item Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Jio Fiber Bill, Swiggy Dinner"
                  className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                />
              </div>

              {/* Row for Amount and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-400 text-sm font-black">₹</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-sm pl-8 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as CategoryType)}
                    className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer font-bold text-slate-800"
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
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Date of Expense
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Short Note <span className="text-slate-300 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="e.g. Paid via UPI"
                    className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md transition-all cursor-pointer"
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
