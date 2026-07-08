import React, { useState } from 'react';
import { CategoryType, Transaction } from '../types';
import { CATEGORY_META } from './ExpenseCategoryList';
import { PlusCircle, Calendar, IndianRupee, Tag, FileText } from 'lucide-react';

interface TransactionFormProps {
  userId: string;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  selectedMonth: string; // fallback to prefill date month
}

export default function TransactionForm({
  userId,
  onAddTransaction,
  selectedMonth,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !date) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      userId,
      title: title.trim(),
      amount: parsedAmount,
      category,
      date,
      description: description.trim() || undefined,
    });

    // Reset fields (preserve date and category for convenient batch entry)
    setTitle('');
    setAmount('');
    setDescription('');
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <PlusCircle className="w-4 h-4 text-teal-600 animate-pulse" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Record New Expense
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Field */}
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Expense Item Title
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Jio Fiber Bill, Swiggy Dinner"
              className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
            />
          </div>
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
                value={amount}
                onChange={e => setAmount(e.target.value)}
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
              value={category}
              onChange={e => setCategory(e.target.value as CategoryType)}
              className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer font-bold text-slate-800"
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
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Date of Expense
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Short Note / Description <span className="text-slate-300 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Paid via UPI"
              className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-teal-600 hover:bg-teal-500 rounded-2xl transition-transform hover:scale-[1.01] shadow-md cursor-pointer"
        >
          Add to Spend Sheet
        </button>
      </form>
    </div>
  );
}
