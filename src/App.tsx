/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction } from './types';
import UserProfileManager from './components/UserProfileManager';
import DashboardOverview from './components/DashboardOverview';
import ExpenseCategoryList from './components/ExpenseCategoryList';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import { LogoFull } from './components/Logo';
import { IndianRupee, HelpCircle, Sparkles, BookOpen, CreditCard, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  subscribeUsers,
  subscribeTransactions,
  saveUserProfile,
  deleteUserProfileAndData,
  saveTransaction,
  deleteTransactionFromDb,
  wipeAllDataFromDb
} from './firebase';

const LOCAL_STORAGE_USERS_KEY = 'salary_spend_users_v1';
const LOCAL_STORAGE_TX_KEY = 'salary_spend_transactions_v1';
const LOCAL_STORAGE_ACTIVE_USER_KEY = 'salary_spend_active_user_v1';

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribeUsers = subscribeUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
    });

    const unsubscribeTxs = subscribeTransactions((fetchedTxs) => {
      setTransactions(fetchedTxs);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTxs();
    };
  }, []);

  // Restore/Sync Active User Profile Selection
  useEffect(() => {
    if (loading) return;
    
    const savedActiveId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
    let targetUser: UserProfile | null = null;

    if (savedActiveId && users.length > 0) {
      const found = users.find(u => u.id === savedActiveId);
      if (found) {
        targetUser = found;
      }
    }
    
    if (!targetUser && users.length > 0) {
      if (currentUser && users.some(u => u.id === currentUser.id)) {
        targetUser = users.find(u => u.id === currentUser.id) || users[0];
      } else {
        targetUser = users[0];
      }
    }

    // Compare primitive values to avoid infinite render/state-update loops
    const hasIdChanged = currentUser?.id !== targetUser?.id;
    const hasNameChanged = currentUser?.name !== targetUser?.name;
    const hasSalaryChanged = currentUser?.salary !== targetUser?.salary;
    const hasIncentiveChanged = (currentUser?.incentive ?? null) !== (targetUser?.incentive ?? null);
    const hasMonthlyIncomesChanged = JSON.stringify(currentUser?.monthlyIncomes ?? null) !== JSON.stringify(targetUser?.monthlyIncomes ?? null);

    if (hasIdChanged || hasNameChanged || hasSalaryChanged || hasIncentiveChanged || hasMonthlyIncomesChanged) {
      setCurrentUser(targetUser);
    }
    // We intentionally omit currentUser from the dependency array because updates are
    // handled explicitly in select/add/delete actions. Including it here can cause
    // cyclic rendering loops during database and localStorage state sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, loading]);

  // Sync Active User to LocalStorage so we restore the active tab/profile on reload
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_KEY, currentUser.id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
    }
  }, [currentUser]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFormOpen]);

  // Migrate local data to Firestore if Firestore is empty on first boot
  useEffect(() => {
    if (loading) return;

    const performMigration = async () => {
      const savedUsersStr = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const savedTxStr = localStorage.getItem(LOCAL_STORAGE_TX_KEY);

      const localUsers: UserProfile[] = savedUsersStr ? JSON.parse(savedUsersStr) : [];
      const localTxs: Transaction[] = savedTxStr ? JSON.parse(savedTxStr) : [];

      if (users.length === 0 && localUsers.length > 0) {
        console.log('Migrating local storage data to Cloud Firestore...');
        for (const user of localUsers) {
          await saveUserProfile(user);
        }
        for (const tx of localTxs) {
          await saveTransaction(tx);
        }
        localStorage.removeItem(LOCAL_STORAGE_USERS_KEY);
        localStorage.removeItem(LOCAL_STORAGE_TX_KEY);
      }
    };

    performMigration();
  }, [loading, users.length]);

  // Handler to switch active profile
  const handleSelectUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  // Handler to add a new profile
  const handleAddUser = async (name: string, salary: number, incentive?: number | null) => {
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      salary,
      incentive: incentive ?? null,
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    await saveUserProfile(newUser);
    setCurrentUser(newUser); // Automatically switch to the newly created profile
  };

  // Handler to update name or salary of active profile
  const handleUpdateUser = async (updatedUser: UserProfile) => {
    await saveUserProfile(updatedUser);
    setCurrentUser(updatedUser);
  };

  // Handler to delete a user profile
  const handleDeleteUser = async (userId: string) => {
    // If the deleted user is the current active user, switch to another user first
    if (currentUser?.id === userId) {
      const remainingUsers = users.filter(u => u.id !== userId);
      if (remainingUsers.length > 0) {
        setCurrentUser(remainingUsers[0]);
      } else {
        setCurrentUser(null);
      }
    }
    await deleteUserProfileAndData(userId);
  };

  // Handler to record a transaction
  const handleAddTransaction = async (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
    };
    await saveTransaction(newTx);
    
    // Update selectedMonth if the added transaction belongs to a different month
    const addedMonth = newTxData.date.slice(0, 7); // YYYY-MM
    setSelectedMonth(addedMonth);
    
    // Auto-close mobile drawer/modal if open
    setIsMobileFormOpen(false);
  };

  // Handler to delete a transaction
  const handleDeleteTransaction = async (id: string) => {
    await deleteTransactionFromDb(id);
  };

  // Handler to update an existing transaction
  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    await saveTransaction(updatedTx);
  };

  // Only get transactions belonging to the current active user
  const currentUserTransactions = React.useMemo(() => {
    if (!currentUser) return [];
    return transactions.filter(t => t.userId === currentUser.id);
  }, [transactions, currentUser]);

  // Calculate available months from current user's logged transactions (to populate dropdown)
  // Ensure that at least '2026-07' and '2026-06' are always present
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add('2026-07');
    monthsSet.add('2026-06');
    
    currentUserTransactions.forEach(t => {
      const monthStr = t.date.slice(0, 7); // YYYY-MM
      if (/^\d{4}-\d{2}$/.test(monthStr)) {
        monthsSet.add(monthStr);
      }
    });

    return Array.from(monthsSet).sort().reverse(); // Sort descending (newest months first)
  }, [currentUserTransactions]);

  // Wipe all data to start with a fresh clean slate (completely removes storage items)
  const handleClearAllData = async () => {
    await wipeAllDataFromDb();
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
    setSelectedMonth('2026-07');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 font-sans selection:bg-teal-50 selection:text-teal-900">
      {/* Top Banner Accent */}
      <div className="h-1.5 w-full bg-teal-600" />

      {/* Main Workspace container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Header section as a Bento Card */}
        <header className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <LogoFull size={42} />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-6 sm:p-12 text-center shadow-sm max-w-sm mx-auto space-y-4 my-6 sm:my-12">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center mx-auto text-teal-600 animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Syncing Cloud Ledger...
            </p>
          </div>
        ) : currentUser === null ? (
          <div className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-5 sm:p-8 shadow-sm max-w-xl mx-auto text-center space-y-4 sm:space-y-6 my-6 sm:my-12">
            <div className="w-16 h-16 rounded-[24px] bg-teal-50 flex items-center justify-center text-teal-600 mx-auto border-2 border-teal-100 shadow-sm animate-pulse">
              <IndianRupee className="w-8 h-8 font-black" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight">
                Welcome to Spend Wisely
              </h2>
              <p className="text-sm font-semibold text-slate-500 max-w-sm mx-auto">
                Track your monthly INR salary and category expenses in a secure, local, bento-style dashboard.
              </p>
            </div>

             <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const salaryVal = formData.get('salary') as string;
              const incentiveVal = formData.get('incentive') as string;
              
              if (!name.trim() || !salaryVal) return;
              const salaryNum = parseFloat(salaryVal);
              if (isNaN(salaryNum) || salaryNum <= 0) return;
              
              const incentiveNum = incentiveVal ? parseFloat(incentiveVal) : null;
              
              handleAddUser(
                name.trim(),
                salaryNum,
                isNaN(incentiveNum ?? NaN) ? null : incentiveNum
              );
            }} className="space-y-4 text-left max-w-sm mx-auto pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Your Full Name / Username
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-sm px-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Monthly Base Salary (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 text-sm font-black">₹</span>
                  <input
                    name="salary"
                    type="number"
                    required
                    placeholder="e.g. 75000"
                    className="w-full text-sm pl-8 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  This sets your core monthly spending and balance limit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Incentive / Bonus (INR, Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 text-sm font-bold">₹</span>
                  <input
                    name="incentive"
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    className="w-full text-sm pl-8 pr-4 py-2.5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-bold text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-teal-600 hover:bg-teal-500 rounded-2xl transition-transform hover:scale-[1.01] shadow-md cursor-pointer pt-3"
              >
                Create My Active Profile
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Profile Switcher Block (Mandatory User Names Support) */}
            <section id="profile-management-section">
              <UserProfileManager
                users={users}
                currentUser={currentUser}
                onSelectUser={handleSelectUser}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            </section>

            {/* Dashboard and Core Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
              
              {/* Left Column (Stats & Visualizations) - 7 cols on large screens */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <section id="dashboard-overview-section">
                  <DashboardOverview
                    currentUser={currentUser}
                    transactions={currentUserTransactions}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    availableMonths={availableMonths}
                    onUpdateUser={handleUpdateUser}
                  />
                </section>

                <section id="category-distribution-section">
                  <ExpenseCategoryList
                    transactions={currentUserTransactions}
                    selectedMonth={selectedMonth}
                  />
                </section>
              </div>

              {/* Right Column (Recording & Log sheets) - 5 cols on large screens */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                <section id="record-expense-section" className="hidden md:block">
                  <TransactionForm
                    userId={currentUser.id}
                    onAddTransaction={handleAddTransaction}
                    selectedMonth={selectedMonth}
                  />
                </section>

                <section id="transactions-log-section">
                  <TransactionList
                    currentUser={currentUser}
                    transactions={currentUserTransactions}
                    selectedMonth={selectedMonth}
                    onDeleteTransaction={handleDeleteTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                  />
                </section>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="bg-white border-2 border-slate-200 rounded-3xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Spend Wisely Tracker — INR Ledger Standard</span>
              </div>
              <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                Cloud Ledger Synchronized
              </p>
            </div>

            <div className="shrink-0">
              {(users.length > 0 || transactions.length > 0) && (
                isConfirmingClear ? (
                  <div className="flex items-center gap-1.5 bg-red-50 border-2 border-red-200 rounded-2xl p-1 shrink-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest pl-1.5">Wipe All?</span>
                    <button
                      onClick={() => {
                        handleClearAllData();
                        setIsConfirmingClear(false);
                      }}
                      className="px-3 py-1.5 text-[10px] sm:text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setIsConfirmingClear(false)}
                      className="px-3 py-1.5 text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-200 bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsConfirmingClear(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 bg-white rounded-2xl border border-slate-200 hover:border-red-200 shadow-xs transition-all duration-300 text-xs font-bold cursor-pointer"
                    aria-label="Clear Data"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    <span>Clear All Data</span>
                  </button>
                )
              )}
            </div>
          </div>
        </footer>

        {/* Floating Action Button for Mobile Expense Addition */}
        {currentUser && (
          <>
            <button
              onClick={() => setIsMobileFormOpen(true)}
              className="fixed bottom-6 right-6 z-40 md:hidden bg-teal-600 hover:bg-teal-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(13,148,136,0.4)] active:scale-95 transition-all duration-200 border-2 border-white cursor-pointer group"
              style={{ bottom: '24px', right: '24px' }}
              aria-label="Add Expense"
            >
              <Plus className="w-7 h-7 transition-transform duration-300 group-hover:rotate-90" />
            </button>

            {/* Mobile Form Pop-out Modal Overlay */}
            <AnimatePresence>
              {isMobileFormOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileFormOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50"
                  />

                  {/* Pop-out Content Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, x: '-50%', y: '-40%' }}
                    animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                    exit={{ opacity: 0, scale: 0.92, x: '-50%', y: '-40%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                    className="fixed top-1/2 left-1/2 z-55 bg-white rounded-[32px] p-6 shadow-2xl w-[92vw] max-w-md max-h-[85vh] overflow-y-auto border-2 border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-teal-600 animate-pulse" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Record New Expense
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsMobileFormOpen(false)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl cursor-pointer transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Actual form body */}
                    <TransactionForm
                      userId={currentUser.id}
                      onAddTransaction={handleAddTransaction}
                      onSuccess={() => setIsMobileFormOpen(false)}
                      selectedMonth={selectedMonth}
                      isModal={true}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
