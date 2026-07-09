export interface UserProfile {
  id: string;
  name: string;
  salary: number; // monthly salary in INR
  joinedAt: string; // ISO date
  incentive?: number | null; // optional incentive in INR
  monthlyIncomes?: {
    [monthYear: string]: {
      salary: number;
      incentive?: number | null;
    }
  } | null;
}

export type CategoryType =
  | 'Rent & Housing'
  | 'Food & Groceries'
  | 'Bills & Utilities'
  | 'Transport & Commute'
  | 'Dining & Entertainment'
  | 'Investments & Savings'
  | 'Shopping'
  | 'Healthcare & Insurance'
  | 'EMI & Loan'
  | 'Subscriptions'
  | 'Credit Card'
  | 'Other Expenses';

export interface CategoryBudget {
  category: CategoryType;
  limit: number; // budget limit for this category
}

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: CategoryType;
  date: string; // YYYY-MM-DD
  description?: string;
  isRecurring?: boolean;
}

export interface MonthlySummary {
  monthYear: string; // YYYY-MM
  totalSalary: number;
  totalSpent: number;
  totalSaved: number;
}
