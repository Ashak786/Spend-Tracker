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
  photoUrl?: string;
  isIncomeProfile?: boolean; // auto-created profile for an incoming fund (e.g. Church Office, Akshay)
  incomeSourceId?: string; // ID of the linked income source
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

export type BudgetBucket = 'Needs' | 'Wants' | 'Savings' | 'None';

export type IncomeCategory =
  | 'Savings'
  | 'Freelance & Side Gig'
  | 'Bonus & Incentives'
  | 'Other Inflow';

export interface IncomeSource {
  id: string;
  userId: string;
  sourceName: string; // e.g. "Church Office", "My Bro Akshay"
  amount: number; // total amount received in INR
  category: IncomeCategory;
  date: string; // YYYY-MM-DD
  notes?: string;
  receivedFrom?: string;
}

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
  budgetBucket?: BudgetBucket;
  incomeSourceId?: string; // ID of the specific income source used (undefined / 'salary' = Monthly Base Salary)
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
