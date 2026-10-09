/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, IncomeSource } from './types';
import { getCurrentMonthKey, getCurrentDateKey } from './utils';
import UserProfileManager from './components/UserProfileManager';
import DashboardOverview from './components/DashboardOverview';
import ExpenseCategoryList from './components/ExpenseCategoryList';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import IncomeTracker from './components/IncomeTracker';
import { LogoFull } from './components/Logo';
import PINEntry from './components/PINEntry';
import { IndianRupee, HelpCircle, Sparkles, BookOpen, CreditCard, X, Plus, ArrowDownLeft, Wallet, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  subscribeUsers,
  subscribeTransactions,
  subscribeIncomes,
  saveUserProfile,
  deleteUserProfileAndData,
  saveTransaction,
  deleteTransactionFromDb,
  saveIncomeSource,
  deleteIncomeSourceFromDb,
  wipeAllDataFromDb
} from './firebase';

const LOCAL_STORAGE_USERS_KEY = 'salary_spend_users_v1';
const LOCAL_STORAGE_TX_KEY = 'salary_spend_transactions_v1';
const LOCAL_STORAGE_ACTIVE_USER_KEY = 'salary_spend_active_user_v1';

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [activeSection, setActiveSection] = useState<'salary_tracker' | 'income_tracker' | 'profiles'>('salary_tracker');
  const [preselectedIncomeId, setPreselectedIncomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);

  // Listen to system appearance theme changes and apply 'dark' class accordingly
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initial check
    handleChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribeUsers = subscribeUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
    });

    const unsubscribeTxs = subscribeTransactions((fetchedTxs) => {
      setTransactions(fetchedTxs);
    });

    const unsubscribeIncomes = subscribeIncomes((fetchedIncomes) => {
      setIncomes(fetchedIncomes);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTxs();
      unsubscribeIncomes();
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
    const hasPhotoUrlChanged = (currentUser?.photoUrl ?? null) !== (targetUser?.photoUrl ?? null);
    const hasMonthlyIncomesChanged = JSON.stringify(currentUser?.monthlyIncomes ?? null) !== JSON.stringify(targetUser?.monthlyIncomes ?? null);

    if (hasIdChanged || hasNameChanged || hasSalaryChanged || hasIncentiveChanged || hasPhotoUrlChanged || hasMonthlyIncomesChanged) {
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

  // Handler to add a new user profile (supports both Salary and Inflow profiles)
  const handleAddUser = (
    name: string,
    salary: number,
    incentive?: number | null,
    photoUrl?: string,
    isIncomeProfile?: boolean,
    incomeSourceId?: string
  ) => {
    const newUser: UserProfile = {
      id: isIncomeProfile && incomeSourceId ? `profile-inc-${incomeSourceId}` : `user-${Date.now()}`,
      name,
      salary,
      incentive: incentive ?? null,
      joinedAt: getCurrentDateKey(),
      photoUrl,
      isIncomeProfile: !!isIncomeProfile,
      incomeSourceId: incomeSourceId || undefined,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser); // Automatically switch to the newly created profile
    saveUserProfile(newUser).catch(err => console.error('Failed to save user profile:', err));
  };

  // Handler to update name or salary of active profile
  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    saveUserProfile(updatedUser).catch(err => console.error('Failed to update user profile:', err));
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
    setUsers(prev => prev.filter(u => u.id !== userId));
    await deleteUserProfileAndData(userId);
  };

  // Handler to record a transaction
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    // Keep transaction under active account with incomeSourceId linked
    const newTx: Transaction = {
      ...newTxData,
      userId: currentUser ? currentUser.id : newTxData.userId,
      id: `tx-${Date.now()}`,
    };
    
    // Optimistically update local transaction list for immediate UI responsiveness
    setTransactions(prev => [newTx, ...prev]);

    // Update selectedMonth if the added transaction belongs to a different month
    const addedMonth = newTxData.date.slice(0, 7); // YYYY-MM
    setSelectedMonth(addedMonth);
    
    // Auto-close mobile drawer/modal if open
    setIsMobileFormOpen(false);

    // Save to Firestore in background
    saveTransaction(newTx).catch(err => console.error('Failed to save transaction:', err));
  };

  // Handler to delete a transaction
  const handleDeleteTransaction = (id: string) => {
    // Optimistically update local transaction list
    setTransactions(prev => prev.filter(t => t.id !== id));

    deleteTransactionFromDb(id).catch(err => console.error('Failed to delete transaction:', err));
  };

  // Handler to update an existing transaction
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    // Optimistically update local transaction list
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));

    saveTransaction(updatedTx).catch(err => console.error('Failed to update transaction:', err));
  };

  // Income Inflow Handlers (Entered and saved directly under Income Tracker)
  const handleAddIncome = (newIncomeData: Omit<IncomeSource, 'id'>) => {
    const newId = `inc-${Date.now()}`;
    const newIncome: IncomeSource = {
      ...newIncomeData,
      id: newId,
    };
    setIncomes(prev => [newIncome, ...prev]);
    saveIncomeSource(newIncome).catch(err => console.error('Failed to save income source:', err));
  };

  const handleUpdateIncome = (updatedIncome: IncomeSource) => {
    setIncomes(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
    saveIncomeSource(updatedIncome).catch(err => console.error('Failed to update income source:', err));
  };

  const handleDeleteIncome = async (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    const profileId = `profile-inc-${id}`;
    await deleteUserProfileAndData(profileId);
    await deleteIncomeSourceFromDb(id);
  };

  const handleSelectIncomeToSpend = (incomeSourceId: string) => {
    setPreselectedIncomeId(incomeSourceId);
    setActiveSection('salary_tracker');
    // Open mobile modal if viewport is mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileFormOpen(true);
    }
  };

  // Only get transactions belonging to the current active user or linked to this income profile
  const currentUserTransactions = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.isIncomeProfile && currentUser.incomeSourceId) {
      return transactions.filter(t => t.incomeSourceId === currentUser.incomeSourceId || t.userId === currentUser.id);
    }
    return transactions.filter(t => t.userId === currentUser.id);
  }, [transactions, currentUser]);

  // Salary Spend Tracker transactions: STRICTLY only transactions paid from salary (not external funds)
  const salaryTransactions = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.isIncomeProfile) {
      return currentUserTransactions;
    }
    // Base salary profile: exclude any transactions paid from an external income source!
    return currentUserTransactions.filter(t => !t.incomeSourceId || t.incomeSourceId === 'salary');
  }, [currentUserTransactions, currentUser]);

  // Only get incomes belonging to the current active user
  const currentUserIncomes = React.useMemo(() => {
    if (!currentUser) return [];
    return incomes.filter(i => i.userId === currentUser.id);
  }, [incomes, currentUser]);

  // Calculate available months from current user's logged transactions (to populate dropdown)
  // Ensures the current month and any transaction/monthlyIncome months are included
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    const currentMonth = getCurrentMonthKey();
    monthsSet.add(currentMonth);
    
    currentUserTransactions.forEach(t => {
      const monthStr = t.date.slice(0, 7); // YYYY-MM
      if (/^\d{4}-\d{2}$/.test(monthStr)) {
        monthsSet.add(monthStr);
      }
    });

    if (currentUser?.monthlyIncomes) {
      Object.keys(currentUser.monthlyIncomes).forEach(m => {
        if (/^\d{4}-\d{2}$/.test(m)) {
          monthsSet.add(m);
        }
      });
    }

    return Array.from(monthsSet).sort().reverse(); // Sort descending (newest months first)
  }, [currentUserTransactions, currentUser]);

  // Wipe all data to start with a fresh clean slate (completely removes storage items)
  const handleClearAllData = async () => {
    await wipeAllDataFromDb();
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_KEY);
    setSelectedMonth(getCurrentMonthKey());
  };

  // Smoothly switch section when navigation buttons are clicked
  const handleNavRedirect = (target: 'salary' | 'inflows' | 'profiles') => {
    if (target === 'profiles') {
      setActiveSection('profiles');
      return;
    }

    const nextSection = target === 'salary' ? 'salary_tracker' : 'income_tracker';
    setActiveSection(nextSection);
    if (target === 'salary') {
      setPreselectedIncomeId(null);
    }
  };

  if (!isPinVerified) {
    return <PINEntry onVerify={() => setIsPinVerified(true)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-50 dark:selection:bg-blue-950/40 selection:text-blue-900 transition-colors duration-300 pb-20 md:pb-0">
      {/* Beautiful ambient glowing spots for Glassmorphism matching the brand palette */}
      <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-blue-300/20 dark:bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-[10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] rounded-full bg-orange-300/15 dark:bg-orange-500/5 blur-[150px] pointer-events-none" />
      <div className="hidden md:block absolute top-[45%] right-[15%] w-[35vw] h-[35vw] max-w-[500px] rounded-full bg-blue-200/15 dark:bg-blue-500/5 blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute top-[15%] left-[40%] w-[40vw] h-[40vw] max-w-[550px] rounded-full bg-orange-200/15 dark:bg-orange-500/5 blur-[120px] pointer-events-none" />

      {/* Top Banner Accent with Spend Wisely deep blue to orange gradient */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-orange-500 to-blue-800 relative z-10 animate-pulse" />

      {/* Main Workspace container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 relative z-10 pb-32 md:pb-8">
        
        {/* Header section as a Bento Card with elevated branding & profile status */}
        <header className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl sm:rounded-[32px] p-4 sm:p-5 shadow-[0_8px_32px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/95 dark:hover:border-white/15">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <LogoFull size={48} />
            </div>

            {currentUser && (
              <button
                type="button"
                id="header-user-badge"
                onClick={() => handleNavRedirect('profiles')}
                className="flex items-center gap-2 sm:gap-3 bg-white/40 dark:bg-slate-950/20 px-3.5 py-2 rounded-2xl border border-white/60 dark:border-white/5 shadow-xs transition-all hover:bg-white/60 dark:hover:bg-slate-950/30 cursor-pointer text-left"
                title="Switch or manage profiles"
              >
                <img
                  src={currentUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 object-cover"
                />
                <div className="text-right hidden sm:block">
                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Profile</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight mt-0.5">{currentUser.name}</p>
                </div>
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl sm:rounded-[32px] p-6 sm:p-12 text-center shadow-[0_8px_32px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] max-w-sm mx-auto space-y-4 my-6 sm:my-12">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-100 dark:border-blue-900/40 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Syncing Cloud Ledger...
            </p>
          </div>
        ) : currentUser === null ? (
          <div className="bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl sm:rounded-[32px] p-5 sm:p-8 shadow-[0_8px_32px_rgba(15,23,42,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] max-w-xl mx-auto text-center space-y-4 sm:space-y-6 my-6 sm:my-12">
            <div className="w-16 h-16 rounded-[24px] bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto border-2 border-blue-100 dark:border-blue-900/40 shadow-sm animate-pulse">
              <IndianRupee className="w-8 h-8 font-black text-orange-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight uppercase">
                Welcome to Spend Wisely
              </h2>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Your Full Name / Username
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-base md:text-sm px-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-100 focus:bg-white/90 dark:focus:bg-slate-900/80 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Monthly Base Salary (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-black">₹</span>
                  <input
                    name="salary"
                    type="number"
                    required
                    placeholder="e.g. 75000"
                    className="w-full text-base md:text-sm pl-8 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-100 focus:bg-white/90 dark:focus:bg-slate-900/80 transition-all duration-200"
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                  This sets your core monthly spending and balance limit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Incentive / Bonus (INR, Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-slate-400 dark:text-slate-500 text-sm font-bold">₹</span>
                  <input
                    name="incentive"
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    className="w-full text-base md:text-sm pl-8 pr-4 py-2.5 border border-slate-200/60 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-slate-100 focus:bg-white/90 dark:focus:bg-slate-900/80 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-transform hover:scale-[1.01] shadow-md cursor-pointer pt-3"
              >
                Create My Active Profile
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Section Switcher Tabs: Just Salary Tracker and Income Inflow */}
            <div id="section-switcher-bar" className="scroll-mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 md:bg-white/50 md:dark:bg-slate-900/40 backdrop-blur-none md:backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl p-2 shadow-xs">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleNavRedirect('salary')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === 'salary_tracker'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Salary Tracker</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavRedirect('inflows')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === 'income_tracker'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Income Inflow</span>
                  {currentUserIncomes.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {currentUserIncomes.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Status highlight in tab bar */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2 text-slate-500 dark:text-slate-400">
                {activeSection === 'salary_tracker' ? (
                  <span>Tracking base salary & 50/30/20 budgets</span>
                ) : activeSection === 'income_tracker' ? (
                  <span>Tracking incoming funds & allocations</span>
                ) : (
                  <span>Managing user profiles</span>
                )}
              </div>
            </div>

            {/* View Switching: Salary Spend Tracker vs Income Inflow Tracker vs User Profiles */}
            {activeSection === 'salary_tracker' ? (
              /* Dashboard and Core Controls Grid */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                
                {/* Left Column (Stats & Visualizations) - 7 cols on large screens */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                  <section id="dashboard-overview-section" className="scroll-mt-6">
                    <DashboardOverview
                      currentUser={currentUser}
                      transactions={salaryTransactions}
                      selectedMonth={selectedMonth}
                      onMonthChange={setSelectedMonth}
                      availableMonths={availableMonths}
                      onUpdateUser={handleUpdateUser}
                    />
                  </section>

                  <section id="category-distribution-section" className="scroll-mt-6">
                    <ExpenseCategoryList
                      transactions={salaryTransactions}
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
                      incomes={[]}
                      transactions={transactions}
                      preselectedIncomeId={null}
                    />
                  </section>

                  <section id="transactions-log-section" className="scroll-mt-6">
                    <TransactionList
                      currentUser={currentUser}
                      transactions={salaryTransactions}
                      selectedMonth={selectedMonth}
                      onDeleteTransaction={handleDeleteTransaction}
                      onUpdateTransaction={handleUpdateTransaction}
                    />
                  </section>
                </div>
              </div>
            ) : activeSection === 'income_tracker' ? (
              <section id="income-tracker-section" className="scroll-mt-6">
                <IncomeTracker
                  currentUser={currentUser}
                  incomes={currentUserIncomes}
                  transactions={transactions}
                  users={users}
                  onAddIncome={handleAddIncome}
                  onUpdateIncome={handleUpdateIncome}
                  onDeleteIncome={handleDeleteIncome}
                  onSelectIncomeToSpend={handleSelectIncomeToSpend}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onUpdateTransaction={handleUpdateTransaction}
                  onSelectUser={(id) => {
                    handleSelectUser(id);
                    setActiveSection('income_tracker');
                  }}
                />
              </section>
            ) : (
              <section id="profile-management-section" className="scroll-mt-6">
                <UserProfileManager
                  users={users}
                  currentUser={currentUser}
                  onSelectUser={(id) => {
                    handleSelectUser(id);
                  }}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onNavigateSection={(sec) => handleNavRedirect(sec)}
                />
              </section>
            )}
          </>
        )}



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
                className="fixed inset-0 bg-slate-950/60 z-50"
              />

              {/* Pop-out Content Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-48%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-48%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed top-1/2 left-1/2 z-[60] bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.2)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.5)] w-[92vw] max-w-md max-h-[82vh] overflow-y-auto overscroll-contain no-scrollbar border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Record New Expense
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileFormOpen(false);
                      setPreselectedIncomeId(null);
                    }}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Actual form body */}
                <TransactionForm
                  userId={currentUser!.id}
                  onAddTransaction={handleAddTransaction}
                  onSuccess={() => {
                    setIsMobileFormOpen(false);
                    setPreselectedIncomeId(null);
                  }}
                  selectedMonth={selectedMonth}
                  isModal={true}
                  incomes={activeSection === 'income_tracker' ? currentUserIncomes : []}
                  transactions={currentUserTransactions}
                  preselectedIncomeId={preselectedIncomeId}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Clear Data Confirmation Popup Modal Overlay */}
        <AnimatePresence>
          {isConfirmingClear && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsConfirmingClear(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50"
              />

              {/* Pop-out Content Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, x: '-50%', y: '-40%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.92, x: '-50%', y: '-40%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                className="fixed top-1/2 left-1/2 z-[60] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[32px] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.15)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)] w-[92vw] max-w-md border border-white/80 dark:border-white/10 space-y-5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0 border border-rose-200/40 dark:border-rose-900/40">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">
                      Wipe All Data?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      This action is permanent and cannot be undone. All custom profiles, monthly salary overrides, and spending transactions will be completely wiped from the database.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleClearAllData();
                      setIsConfirmingClear(false);
                    }}
                    className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 rounded-xl cursor-pointer transition-colors"
                  >
                    Yes, Clear Everything
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating & Fixed Navigation Dock (Mobile Only) */}
        {currentUser && (
          <nav
            aria-label="Floating Navigation Bar"
            className="fixed bottom-5 sm:bottom-7 inset-x-0 mx-auto z-50 w-[calc(100%-1.5rem)] max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/90 dark:border-white/15 rounded-3xl p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.22),0_4px_16px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_54px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.1)] grid grid-cols-4 items-center gap-1 ring-1 ring-slate-900/5 dark:ring-white/10 pointer-events-auto select-none md:hidden"
          >
            {/* Tab 1: Salary Tracker */}
            <button
              type="button"
              onClick={() => handleNavRedirect('salary')}
              className={`flex flex-col items-center justify-center min-h-[46px] w-full py-1.5 px-2 rounded-2xl transition-colors duration-150 cursor-pointer tap-highlight-transparent select-none ${
                activeSection === 'salary_tracker'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 font-medium'
              }`}
              aria-label="Salary Tracker"
            >
              <CreditCard className="w-5 h-5 transition-transform" />
              <span className="text-[10px] tracking-tight mt-0.5">Salary</span>
              {activeSection === 'salary_tracker' && (
                <span className="w-1.5 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
              )}
            </button>

            {/* Tab 2: Income Inflows */}
            <button
              type="button"
              onClick={() => handleNavRedirect('inflows')}
              className={`flex flex-col items-center justify-center min-h-[46px] w-full py-1.5 px-2 rounded-2xl transition-colors duration-150 cursor-pointer tap-highlight-transparent select-none relative ${
                activeSection === 'income_tracker'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 font-medium'
              }`}
              aria-label="Income Inflows"
            >
              <div className="relative">
                <ArrowDownLeft className="w-5 h-5 transition-transform" />
                {currentUserIncomes.length > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs">
                    {currentUserIncomes.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Inflows</span>
              {activeSection === 'income_tracker' && (
                <span className="w-1.5 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" />
              )}
            </button>

            {/* Tab 3: Quick Add Expense Action */}
            <button
              type="button"
              onClick={() => setIsMobileFormOpen(true)}
              className="flex flex-col items-center justify-center min-h-[46px] w-full py-1 cursor-pointer tap-highlight-transparent select-none group"
              aria-label="Record New Expense"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 active:from-blue-700 active:to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 active:scale-95 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">Add</span>
            </button>

            {/* Tab 4: Profiles */}
            <button
              type="button"
              onClick={() => handleNavRedirect('profiles')}
              className={`flex flex-col items-center justify-center min-h-[46px] w-full py-1.5 px-2 rounded-2xl transition-colors duration-150 cursor-pointer tap-highlight-transparent select-none relative ${
                activeSection === 'profiles'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 font-medium'
              }`}
              aria-label="User Profiles"
            >
              <div className="relative">
                <Users className="w-5 h-5 transition-transform" />
                {users.length > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-purple-500 text-white text-[9px] font-black flex items-center justify-center leading-none shadow-xs">
                    {users.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">Profiles</span>
              {activeSection === 'profiles' && (
                <span className="w-1.5 h-1 rounded-full bg-purple-600 dark:bg-purple-400 mt-0.5" />
              )}
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
