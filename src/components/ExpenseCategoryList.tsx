import React from 'react';
import { Transaction, CategoryType } from '../types';
import { formatCurrency } from '../utils';
import {
  Home,
  ShoppingBag,
  Zap,
  Car,
  Utensils,
  TrendingUp,
  Tag,
  Activity,
  Landmark,
  HelpCircle,
  PieChart,
  Play,
} from 'lucide-react';

interface ExpenseCategoryListProps {
  transactions: Transaction[];
  selectedMonth: string;
}

// Maps category name to its designated Lucide Icon and background/icon color
export const CATEGORY_META: Record<
  CategoryType,
  { icon: React.ComponentType<any>; color: string; bg: string; barBg: string }
> = {
  'Rent & Housing': { icon: Home, color: 'text-blue-600', bg: 'bg-blue-50', barBg: 'bg-blue-600' },
  'Food & Groceries': { icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50', barBg: 'bg-amber-600' },
  'Bills & Utilities': { icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', barBg: 'bg-orange-600' },
  'Transport & Commute': { icon: Car, color: 'text-cyan-600', bg: 'bg-cyan-50', barBg: 'bg-cyan-600' },
  'Dining & Entertainment': { icon: Utensils, color: 'text-rose-600', bg: 'bg-rose-50', barBg: 'bg-rose-600' },
  'Investments & Savings': { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', barBg: 'bg-emerald-600' },
  'Shopping': { icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50', barBg: 'bg-purple-600' },
  'Healthcare & Insurance': { icon: Activity, color: 'text-red-600', bg: 'bg-red-50', barBg: 'bg-red-600' },
  'EMI & Loan': { icon: Landmark, color: 'text-teal-600', bg: 'bg-teal-50', barBg: 'bg-teal-600' },
  'Subscriptions': { icon: Play, color: 'text-indigo-600', bg: 'bg-indigo-50', barBg: 'bg-indigo-600' },
  'Other Expenses': { icon: HelpCircle, color: 'text-pink-600', bg: 'bg-pink-50', barBg: 'bg-pink-600' },
};

export default function ExpenseCategoryList({
  transactions,
  selectedMonth,
}: ExpenseCategoryListProps) {
  // Filter transactions for this month
  const monthlyTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const totalSpent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Aggregate spending by category
  const categorySpending = Object.keys(CATEGORY_META).reduce((acc, catKey) => {
    const category = catKey as CategoryType;
    const amount = monthlyTransactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    acc[category] = amount;
    return acc;
  }, {} as Record<CategoryType, number>);

  // Convert to sorted list (descending order of spending, skipping zero spenders if there are some transactions logged)
  const categoryList = Object.entries(categorySpending)
    .map(([category, amount]) => ({
      category: category as CategoryType,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const hasSpending = totalSpent > 0;

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <PieChart className="w-4 h-4 text-teal-600 animate-pulse" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Spend Distribution by Category
        </h2>
      </div>

      {!hasSpending ? (
        <div className="text-center py-8 text-slate-400 text-xs font-semibold">
          No expenses recorded for this month yet.
        </div>
      ) : (
        <div className="space-y-4">
          {categoryList.map(item => {
            if (item.amount === 0) return null; // Only show active categories

            const meta = CATEGORY_META[item.category] || {
              icon: HelpCircle,
              color: 'text-pink-600',
              bg: 'bg-pink-50',
              barBg: 'bg-pink-600',
            };
            const IconComponent = meta.icon;

            return (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-xl ${meta.bg} ${meta.color} border border-slate-200/50 shrink-0`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-slate-800">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-[10px] font-black text-teal-600 ml-1.5 bg-teal-50 px-2 py-0.5 rounded-md">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                {/* Visual mini bar matching Bento progress track */}
                <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden border-2 border-slate-200 p-0.5">
                  <div
                    style={{
                      width: `${item.percentage}%`,
                    }}
                    className={`h-full rounded-lg transition-all duration-500 ${meta.barBg}`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
