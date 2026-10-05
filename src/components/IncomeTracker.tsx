import React, { useState } from 'react';
import { IncomeSource, Transaction, UserProfile, IncomeCategory } from '../types';
import { formatCurrency, formatIndianDate, getCurrentDateKey } from '../utils';
import { 
  ArrowDownLeft, 
  PlusCircle, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Check, 
  X, 
  Receipt,
  Users,
  Coins, 
  Sparkles, 
  Info,
  UserPlus
} from 'lucide-react';
import { CATEGORY_META } from './ExpenseCategoryList';

export const ACTIVE_INCOME_CATEGORIES: IncomeCategory[] = [
  'Savings',
  'Freelance & Side Gig',
  'Bonus & Incentives',
  'Other Inflow',
];

export const INCOME_CATEGORIES: { [key: string]: { label: string; icon: string; color: string } } = {
  'Savings': { label: 'Savings', icon: '🏦', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  'Freelance & Side Gig': { label: 'Freelance & Side Gig', icon: '💼', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  'Bonus & Incentives': { label: 'Bonus & Incentives', icon: '🎉', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  'Other Inflow': { label: 'Other Inflow', icon: '💰', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  // Backward compatibility fallbacks for existing historical records
  'Church & Community': { label: 'Church & Community', icon: '⛪', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  'Family & Friends': { label: 'Family & Friends', icon: '🤝', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  'Gift & Support': { label: 'Gift & Support', icon: '🎁', color: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300' },
  'Rental & Investments': { label: 'Rental & Investments', icon: '📈', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' },
  'Reimbursement': { label: 'Reimbursement', icon: '🔄', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
};

interface IncomeTrackerProps {
  currentUser: UserProfile;
  incomes: IncomeSource[];
  transactions: Transaction[];
  users?: UserProfile[];
  onAddIncome: (income: Omit<IncomeSource, 'id'>, createProfile?: boolean) => void;
  onUpdateIncome: (income: IncomeSource) => void;
  onDeleteIncome: (id: string) => void;
  onSelectIncomeToSpend?: (incomeSourceId: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onCreateProfile?: (income: IncomeSource) => void;
  onSelectUser?: (userId: string) => void;
}

export default function IncomeTracker({
  currentUser,
  incomes,
  transactions,
  users,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onSelectIncomeToSpend,
  onAddTransaction,
  onCreateProfile,
  onSelectUser,
}: IncomeTrackerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createProfileOption, setCreateProfileOption] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [spendingIncome, setSpendingIncome] = useState<IncomeSource | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  // Form states
  const [sourceName, setSourceName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('Savings');
  const [date, setDate] = useState(getCurrentDateKey());
  const [notes, setNotes] = useState('');

  // Edit form states
  const [editSourceName, setEditSourceName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<IncomeCategory>('Savings');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Spend from Income Modal states
  const [spendTitle, setSpendTitle] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [spendCategory, setSpendCategory] = useState<any>('Food & Groceries');
  const [spendBucket, setSpendBucket] = useState<'Needs' | 'Wants' | 'Savings' | 'None'>('Needs');
  const [spendDate, setSpendDate] = useState(getCurrentDateKey());
  const [spendDescription, setSpendDescription] = useState('');

  // Math calculator helper
  const evaluateMath = (val: string): number | null => {
    const clean = val.replace(/\s+/g, '');
    if (!clean) return null;
    if (!/^[0-9+\-*/().]+$/.test(clean)) return null;
    try {
      const result = new Function(`return (${clean})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
    } catch {
      // Ignore during typing
    }
    return null;
  };

  const isEquation = /[\+\-\*\/]/.test(amount);
  const evaluatedAmount = evaluateMath(amount);

  const isEditEquation = /[\+\-\*\/]/.test(editAmount);
  const evaluatedEditAmount = evaluateMath(editAmount);

  // Map each income source with its linked transactions and spent calculation
  const incomeStats = incomes.map(inc => {
    const linkedTxs = transactions.filter(t => t.incomeSourceId === inc.id);
    const totalSpent = linkedTxs.reduce((sum, t) => sum + t.amount, 0);
    const remaining = inc.amount - totalSpent;
    const spentPercent = inc.amount > 0 ? Math.min(100, Math.round((totalSpent / inc.amount) * 100)) : 0;
    return {
      income: inc,
      linkedTxs,
      totalSpent,
      remaining,
      spentPercent,
    };
  });

  const totalInflowReceived = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalInflowSpent = incomeStats.reduce((sum, s) => sum + s.totalSpent, 0);
  const totalAvailableInflow = totalInflowReceived - totalInflowSpent;

  const handleOpenAddModal = () => {
    setSourceName('');
    setAmount('');
    setCategory('Savings');
    setDate(getCurrentDateKey());
    setNotes('');
    setCreateProfileOption(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (inc: IncomeSource) => {
    setEditingIncome(inc);
    setEditSourceName(inc.sourceName);
    setEditAmount(inc.amount.toString());
    setEditCategory(inc.category);
    setEditDate(inc.date);
    setEditNotes(inc.notes || '');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim() || !amount) return;
    const parsedAmount = evaluatedAmount !== null ? evaluatedAmount : parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddIncome({
      userId: currentUser.id,
      sourceName: sourceName.trim(),
      amount: Number(parsedAmount.toFixed(2)),
      category,
      date: date || getCurrentDateKey(),
      notes: notes.trim() || undefined,
    }, createProfileOption);

    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome || !editSourceName.trim() || !editAmount) return;
    const parsedAmount = evaluatedEditAmount !== null ? evaluatedEditAmount : parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onUpdateIncome({
      ...editingIncome,
      sourceName: editSourceName.trim(),
      amount: Number(parsedAmount.toFixed(2)),
      category: editCategory,
      date: editDate || editingIncome.date || getCurrentDateKey(),
      notes: editNotes.trim() || undefined,
    });

    setEditingIncome(null);
  };

  const handleOpenSpendModal = (inc: IncomeSource) => {
    setSpendingIncome(inc);
    setSpendTitle('');
    setSpendAmount('');
    setSpendCategory('Food & Groceries');
    setSpendBucket('Needs');
    setSpendDate(getCurrentDateKey());
    setSpendDescription('');
  };

  const isSpendEquation = /[\+\-\*\/]/.test(spendAmount);
  const evaluatedSpendAmount = evaluateMath(spendAmount);

  const handleSpendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spendingIncome || !spendTitle.trim() || !spendAmount || !spendDate) return;
    const parsed = evaluatedSpendAmount !== null ? evaluatedSpendAmount : parseFloat(spendAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    onAddTransaction({
      userId: currentUser.id,
      title: spendTitle.trim(),
      amount: Number(parsed.toFixed(2)),
      category: spendCategory,
      budgetBucket: spendBucket,
      incomeSourceId: spendingIncome.id,
      date: spendDate,
      description: spendDescription.trim() || undefined,
    });

    setSpendingIncome(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner and Summary Metric Cards */}
      <div className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl sm:rounded-[32px] p-5 sm:p-7 shadow-[0_8px_32px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Income Inflow & Usage Tracker
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Track where extra money comes from and see what each particular income was used for.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>Log Incoming Money</span>
          </button>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-500" />
              Total Inflows Received
            </span>
            <p className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
              {formatCurrency(totalInflowReceived)}
            </p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Across {incomes.length} recorded income source{incomes.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-orange-500" />
              Total Spent from Inflows
            </span>
            <p className="text-xl sm:text-2xl font-mono font-black text-orange-600 dark:text-orange-400">
              {formatCurrency(totalInflowSpent)}
            </p>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {totalInflowReceived > 0 ? `${Math.round((totalInflowSpent / totalInflowReceived) * 100)}% of inflows utilized` : '0% utilized'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Available Inflow Balance
            </span>
            <p className="text-xl sm:text-2xl font-mono font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalAvailableInflow)}
            </p>
            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400/80">
              Remaining funds available to spend
            </p>
          </div>
        </div>
      </div>

      {/* Income Sources List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Income Streams & Usage ({incomes.length})
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Click any stream to view what it was spent on
          </span>
        </div>

        {incomes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Coins className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No Income Sources Logged Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Received money from savings, freelance gigs, bonuses, or side income? Add it here to track incoming funds and see which money is used for what.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 font-black" />
              <span>Log Your First Income</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {incomeStats.map(({ income: inc, linkedTxs, totalSpent, remaining, spentPercent }) => {
              const isExpanded = expandedSourceId === inc.id;
              const catMeta = INCOME_CATEGORIES[inc.category] || INCOME_CATEGORIES['Other Inflow'];
              const linkedProfile = users?.find(u => u.incomeSourceId === inc.id || u.id === `profile-inc-${inc.id}`);

              return (
                <div
                  key={inc.id}
                  className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all hover:border-slate-300 dark:hover:border-white/20"
                >
                  {/* Top Row: Title, Category, Received Date, Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5 shrink-0">
                        {catMeta.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {inc.sourceName}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catMeta.color}`}>
                            {catMeta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          <span>Received on {formatIndianDate(inc.date)}</span>
                          {inc.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]" title={inc.notes}>{inc.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                      {linkedProfile ? (
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-1 rounded-xl">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            💰 Inflow Profile Active
                          </span>
                          {onSelectUser && (
                            <button
                              onClick={() => onSelectUser(linkedProfile.id)}
                              className="text-[10px] font-black underline text-emerald-800 dark:text-emerald-200 hover:text-emerald-600 cursor-pointer ml-1"
                              title="Switch active user to this profile"
                            >
                              Switch
                            </button>
                          )}
                        </div>
                      ) : onCreateProfile ? (
                        <button
                          type="button"
                          onClick={() => onCreateProfile(inc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-bold border border-slate-200/70 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title="Create an Inflow Profile for this income stream in Profile Management"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>+ Create Profile</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleOpenSpendModal(inc)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/60 text-xs font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-xs active:scale-95"
                        title={`Log an expense paid using money from ${inc.sourceName}`}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Spend from this</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(inc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit income details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {deletingId === inc.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-1 rounded-xl">
                          <button
                            onClick={() => {
                              onDeleteIncome(inc.id);
                              setDeletingId(null);
                            }}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-md cursor-pointer"
                            title="Confirm delete"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-200 rounded-md cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(inc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete income"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 py-3 border-b border-slate-100 dark:border-white/5 text-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Received
                      </p>
                      <p className="text-sm sm:text-base font-mono font-black text-slate-800 dark:text-slate-100 mt-0.5">
                        {formatCurrency(inc.amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Used / Spent
                      </p>
                      <p className="text-sm sm:text-base font-mono font-black text-orange-600 dark:text-orange-400 mt-0.5">
                        {formatCurrency(totalSpent)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Remaining Balance
                      </p>
                      <p className={`text-sm sm:text-base font-mono font-black mt-0.5 ${
                        remaining < 0 
                          ? 'text-rose-600 dark:text-rose-400' 
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar of Utilization */}
                  <div className="py-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-500 dark:text-slate-400">
                        Utilization: {spentPercent}% used
                      </span>
                      <span className={remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {remaining < 0 ? `Overspent by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} available`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          remaining < 0 
                            ? 'bg-rose-500' 
                            : spentPercent > 80 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, spentPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Toggle: "What was this income used for?" */}
                  <div className="pt-2">
                    <button
                      onClick={() => setExpandedSourceId(isExpanded ? null : inc.id)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-900/60 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-blue-500" />
                        <span>Used for what? ({linkedTxs.length} expense{linkedTxs.length === 1 ? '' : 's'} logged)</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Detailed List of Expenses Funded by this Income */}
                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 space-y-2 animate-in fade-in duration-200">
                        {linkedTxs.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 space-y-1">
                            <p className="font-semibold">No expenses recorded against this income yet.</p>
                            <p className="text-[11px]">When recording an expense, select "{inc.sourceName}" in the Funded From dropdown.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {linkedTxs.map(tx => {
                              const catMeta = CATEGORY_META[tx.category] || {
                                icon: Receipt,
                                color: 'text-slate-600',
                                bg: 'bg-slate-50',
                              };
                              const IconComponent = catMeta.icon;

                              return (
                                <div
                                  key={tx.id}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`p-1.5 rounded-lg shrink-0 ${catMeta.bg} ${catMeta.color}`}>
                                      <IconComponent className="w-3.5 h-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 dark:text-white truncate">
                                        {tx.title}
                                      </p>
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                        {formatIndianDate(tx.date)} • {tx.category} {tx.description ? `• ${tx.description}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="font-mono font-black text-slate-900 dark:text-white shrink-0 ml-2">
                                    {formatCurrency(tx.amount)}
                                  </div>
                                </div>
                              );
                            })}

                            <div className="flex justify-between items-center pt-2 px-1 text-xs border-t border-slate-200 dark:border-slate-800">
                              <span className="font-bold text-slate-500">Total Spent From This Income:</span>
                              <span className="font-mono font-black text-orange-600 dark:text-orange-400">
                                {formatCurrency(totalSpent)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add New Income Inflow */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                  Log New Incoming Money
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Income Source / Sender Name
                </label>
                <input
                  type="text"
                  required
                  value={sourceName}
                  onChange={e => setSourceName(e.target.value)}
                  placeholder="e.g. Savings Fund, Freelance Client, Bonus"
                  className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex justify-between items-center">
                    <span>Amount Received (INR)</span>
                    {isEquation && evaluatedAmount !== null && (
                      <span className="text-[10px] text-slate-400 font-medium">Math Mode</span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-black">₹</span>
                    <input
                      type="text"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="e.g. 500 or 15000"
                      className="w-full text-base md:text-sm pl-8 pr-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                  {isEquation && evaluatedAmount !== null && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      = {formatCurrency(evaluatedAmount)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Inflow Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as IncomeCategory)}
                    className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white cursor-pointer"
                  >
                    {ACTIVE_INCOME_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Note / Details <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Sent via GPay, Bank transfer, deposit"
                  className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                />
              </div>

              {/* Optional Inflow Profile Creation Checkbox */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createProfileOption}
                    onChange={e => setCreateProfileOption(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Create dedicated Inflow Profile for this income source
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      (Optional) Adds a separate profile under &quot;Inflow Profiles&quot; in the profile manager. If unchecked, it will be tracked inside this account.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
                >
                  Save Income Inflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Income Inflow */}
      {editingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                  Edit Income Source
                </h3>
              </div>
              <button
                onClick={() => setEditingIncome(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Income Source / Sender Name
                </label>
                <input
                  type="text"
                  required
                  value={editSourceName}
                  onChange={e => setEditSourceName(e.target.value)}
                  className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Amount Received (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-black">₹</span>
                    <input
                      type="text"
                      required
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      className="w-full text-base md:text-sm pl-8 pr-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Inflow Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as IncomeCategory)}
                    className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white cursor-pointer"
                  >
                    {ACTIVE_INCOME_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Note / Details <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="e.g. Sent via GPay, Bank transfer, deposit"
                  className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingIncome(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
                >
                  Update Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Spend From Specific Income Fund (Auto Profile Linked) */}
      {spendingIncome && (() => {
        const linkedTxs = transactions.filter(t => t.incomeSourceId === spendingIncome.id);
        const totalSpent = linkedTxs.reduce((sum, t) => sum + t.amount, 0);
        const remaining = spendingIncome.amount - totalSpent;
        const parsed = evaluatedSpendAmount !== null ? evaluatedSpendAmount : parseFloat(spendAmount);
        const isOverdrawn = !isNaN(parsed) && parsed > remaining;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                      Spend From {spendingIncome.sourceName}
                    </h3>
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Fund: <span className="font-bold underline">{spendingIncome.sourceName}</span> • Deducts from this income fund (Independent of Salary Spend Tracker)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSpendingIncome(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fund Balance Banner */}
              <div className="px-6 pt-4 pb-1">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-600 dark:text-slate-300">Available In Fund:</span>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSpendSubmit} className="p-6 pt-3 space-y-4 text-left">
                {/* Title Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    What was this money spent for?
                  </label>
                  <input
                    type="text"
                    required
                    value={spendTitle}
                    onChange={e => setSpendTitle(e.target.value)}
                    placeholder="e.g. Office Supplies, Groceries, Utility Bill"
                    className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                  />
                </div>

                {/* Amount & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex justify-between items-center">
                      <span>Amount (INR)</span>
                      {isSpendEquation && evaluatedSpendAmount !== null && (
                        <span className="text-[10px] text-slate-400 font-medium">Math Mode</span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-black">₹</span>
                      <input
                        type="text"
                        required
                        value={spendAmount}
                        onChange={e => setSpendAmount(e.target.value)}
                        placeholder="0.00 (or 100+50)"
                        className="w-full text-base md:text-sm pl-8 pr-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                    {isSpendEquation && evaluatedSpendAmount !== null && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                        = {formatCurrency(evaluatedSpendAmount)}
                      </p>
                    )}
                    {isOverdrawn && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1">
                        ⚠️ Exceeds fund remaining balance ({formatCurrency(remaining)})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={spendCategory}
                      onChange={e => setSpendCategory(e.target.value as any)}
                      className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white cursor-pointer"
                    >
                      {Object.keys(CATEGORY_META).map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 50/30/20 Rule Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Category Allocation</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Manual Tag</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpendBucket('Needs')}
                      className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        spendBucket === 'Needs'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>🏠 50% Needs</span>
                      <span className="text-[9px] font-medium opacity-80">Essentials</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpendBucket('Wants')}
                      className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        spendBucket === 'Wants'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>🛍️ 30% Wants</span>
                      <span className="text-[9px] font-medium opacity-80">Lifestyle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpendBucket('Savings')}
                      className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        spendBucket === 'Savings'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>📈 20% Savings</span>
                      <span className="text-[9px] font-medium opacity-80">Investments</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpendBucket('None')}
                      className={`py-2 px-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        spendBucket === 'None'
                          ? 'bg-slate-700 text-white border-slate-700 shadow-md scale-[1.02] dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>💳 Normal</span>
                      <span className="text-[9px] font-medium opacity-80">No Split</span>
                    </button>
                  </div>
                </div>

                {/* Date & Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Date of Expense
                    </label>
                    <input
                      type="date"
                      required
                      value={spendDate}
                      onChange={e => setSpendDate(e.target.value)}
                      className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Note / Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={spendDescription}
                      onChange={e => setSpendDescription(e.target.value)}
                      placeholder="e.g. Paid via UPI"
                      className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSpendingIncome(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
                  >
                    Record Spend from {spendingIncome.sourceName}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
