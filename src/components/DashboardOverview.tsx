import React from 'react';
import { UserProfile, Transaction, CategoryType } from '../types';
import { formatCurrency, formatMonthYear } from '../utils';
import { Wallet, PiggyBank, Receipt, AlertCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { CATEGORY_META } from './ExpenseCategoryList';

interface DashboardOverviewProps {
  currentUser: UserProfile;
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  availableMonths: string[]; // YYYY-MM list
}

export default function DashboardOverview({
  currentUser,
  transactions,
  selectedMonth,
  onMonthChange,
  availableMonths,
}: DashboardOverviewProps) {
  // Filter transactions for current month
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = currentUser.salary - totalSpent;
  const savingsRate = currentUser.salary > 0 ? Math.max(0, ((currentUser.salary - totalSpent) / currentUser.salary) * 100) : 0;
  const spentPercentage = currentUser.salary > 0 ? (totalSpent / currentUser.salary) * 100 : 0;

  // Let's find out if spending exceeded salary
  const isOverspent = totalSpent > currentUser.salary;

  // Calculate spending breakdown by category for the utilization bar segments
  const categorySegments = Object.entries(CATEGORY_META).map(([catKey, meta]) => {
    const categoryName = catKey as CategoryType;
    const amount = monthlyTransactions
      .filter(t => t.category === categoryName)
      .reduce((sum, t) => sum + t.amount, 0);
    const percentage = currentUser.salary > 0 ? (amount / currentUser.salary) * 100 : 0;
    return {
      category: categoryName,
      amount,
      percentage,
      colorClass: meta.barBg,
    };
  }).filter(seg => seg.amount > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Month Selection and Header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <p className="text-slate-500 text-[10px] sm:text-xs font-semibold truncate">
            Dashboard for <span className="font-bold text-slate-800">{currentUser.name}</span>
          </p>
        </div>

        {/* Month Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            id="month-select"
            value={selectedMonth}
            onChange={e => onMonthChange(e.target.value)}
            className="text-xs font-bold bg-white border-2 border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {formatMonthYear(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards - Horizontal Swipeable Carousel on Mobile, 3 Columns on Desktop */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-6 md:pb-0 md:mx-0 md:px-0">
        {/* Salary Income Card */}
        <div className="bg-teal-600 rounded-3xl sm:rounded-[32px] p-5 sm:p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[140px] sm:min-h-[160px] w-[84vw] shrink-0 snap-center md:w-auto">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div>
            <p className="text-teal-200 uppercase tracking-widest text-[10px] font-black">Monthly Salary</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-display mt-2">
              {formatCurrency(currentUser.salary)}
            </h2>
          </div>
          <div className="flex justify-between items-center z-10 mt-4">
            <span className="text-[10px] text-teal-100 bg-white/10 px-3 py-1 rounded-full font-bold">
              Income
            </span>
            <Wallet className="w-5 h-5 text-teal-200" />
          </div>
        </div>

        {/* Total Spending Card */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[140px] sm:min-h-[160px] w-[84vw] shrink-0 snap-center md:w-auto">
          <div>
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Total Spent</p>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight font-display mt-2 ${isOverspent ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
              {formatCurrency(totalSpent)}
            </h2>
          </div>
          <div className="flex justify-between items-center mt-4">
            {isOverspent ? (
              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Overspent Limit!
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {spentPercentage.toFixed(0)}% Spent
              </span>
            )}
            <Receipt className={`w-5 h-5 ${isOverspent ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
        </div>

        {/* Net Savings / Balance Card */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[140px] sm:min-h-[160px] w-[84vw] shrink-0 snap-center md:w-auto">
          <div>
            <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Remaining Balance</p>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight font-display mt-2 ${remainingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(remainingBalance)}
            </h2>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${remainingBalance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
              {remainingBalance >= 0 ? `Savings Rate: ${savingsRate.toFixed(0)}%` : 'Budget Deficit'}
            </span>
            <PiggyBank className={`w-5 h-5 ${remainingBalance >= 0 ? 'text-emerald-500' : 'text-rose-400'}`} />
          </div>
        </div>
      </div>

      {/* Progress Bars for Salary Consumption */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3">
          <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black">Budget Utilization</p>
          <span className={`text-xs font-black ${isOverspent ? 'text-rose-600 animate-pulse' : spentPercentage > 85 ? 'text-amber-500' : 'text-teal-600'}`}>
            {spentPercentage.toFixed(0)}% {isOverspent ? 'Exceeded' : 'Exhausted'}
          </span>
        </div>
        <div>
          <div className={`w-full h-10 rounded-2xl overflow-hidden relative border-2 p-1 flex gap-0.5 transition-all ${isOverspent ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-slate-100'}`}>
            {categorySegments.map((seg) => {
              // Normalize to fit within 100% of the bar width if overspent
              const displayWidth = isOverspent
                ? (seg.amount / totalSpent) * 100
                : seg.percentage;

              if (displayWidth <= 0) return null;

              return (
                <div
                  key={seg.category}
                  className={`h-full transition-all duration-500 ${seg.colorClass} relative group cursor-pointer first:rounded-l-lg last:rounded-r-lg hover:brightness-105 active:scale-y-95`}
                  style={{ width: `${displayWidth}%` }}
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 hidden group-hover:flex bg-slate-900 text-white text-[10px] font-black py-1 px-2.5 rounded-lg whitespace-nowrap shadow-lg z-50 flex-col items-center pointer-events-none animate-in fade-in-50 duration-150">
                    <span>{seg.category}</span>
                    <span className="text-[9px] opacity-90">{formatCurrency(seg.amount)} ({((seg.amount / currentUser.salary) * 100).toFixed(0)}%)</span>
                    <div className="w-1.5 h-1.5 bg-slate-900 transform rotate-45 mt-[-3px] absolute bottom-[-3px]"></div>
                  </div>
                </div>
              );
            })}
            {categorySegments.length === 0 && (
              <div className="h-full w-full rounded-lg bg-slate-200 animate-pulse"></div>
            )}
          </div>
          <div className="flex justify-between mt-3 text-xs font-bold">
            <span className="text-slate-400">Spent: {formatCurrency(totalSpent)}</span>
            <span className="text-slate-900 font-black">Limit: {formatCurrency(currentUser.salary)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
