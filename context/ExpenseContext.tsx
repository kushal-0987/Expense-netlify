import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Member, MemberBalance, AVATAR_COLORS } from '@/constants/ExpenseTypes';

interface ExpenseContextType {
  members: Member[];
  expenses: Expense[];
  memberBalances: MemberBalance[];
  totalExpenses: number;
  thisMonthExpenses: number;
  thisWeekExpenses: number;
  topSpender: { member: Member | null; amount: number };
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addMember: (name: string, role?: string, emoji?: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  settleAll: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const STORAGE_KEYS = {
  MEMBERS: '@family_expense_members_v1',
  EXPENSES: '@family_expense_items_v1',
};

const DEFAULT_MEMBERS: Member[] = [
  { id: '1', name: 'Kushal', role: 'member', emoji: '👦', avatarColor: '#3b82f6' },
  { id: '2', name: 'Sareena', role: 'member', emoji: '👧', avatarColor: '#10b981' },
  { id: '3', name: 'Vinaju', role: 'member', emoji: '👦', avatarColor: '#f59e0b' },
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'e1',
    title: 'dudh biscuit ( duso)',
    amount: 80,
    category: 'Food',
    categoryEmoji: '🍽️',
    date: '2026-10-06',
    time: '10:42:57 PM',
    paidById: '1',
    splitType: 'equal',
    splitMembers: ['1', '2', '3'],
  },
  {
    id: 'e2',
    title: 'Monthly Groceries & Vegetables',
    amount: 24500,
    category: 'Groceries',
    categoryEmoji: '🛒',
    date: '2026-11-02',
    time: '04:15:20 PM',
    paidById: '2',
    splitType: 'equal',
    splitMembers: ['1', '2', '3'],
  },
  {
    id: 'e3',
    title: 'Electricity & Internet Bill',
    amount: 6736,
    category: 'Bills',
    categoryEmoji: '💡',
    date: '2026-11-12',
    time: '11:20:00 AM',
    paidById: '2',
    splitType: 'equal',
    splitMembers: ['1', '2', '3'],
  },
  {
    id: 'e4',
    title: 'Taxi & Vehicle Fuel',
    amount: 4528,
    category: 'Transport',
    categoryEmoji: '🚗',
    date: '2026-11-05',
    time: '06:30:15 PM',
    paidById: '3',
    splitType: 'equal',
    splitMembers: ['1', '2', '3'],
  },
];

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [expenses, setExpenses] = useState<Expense[]>(DEFAULT_EXPENSES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    async function loadData() {
      try {
        const storedMembers = await AsyncStorage.getItem(STORAGE_KEYS.MEMBERS);
        const storedExpenses = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);

        if (storedMembers) {
          setMembers(JSON.parse(storedMembers));
        }
        if (storedExpenses) {
          setExpenses(JSON.parse(storedExpenses));
        }
      } catch (e) {
        console.error('Failed to load expense data', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Save changes
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members)).catch((err) =>
      console.error('Failed to save members', err)
    );
  }, [members, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)).catch((err) =>
      console.error('Failed to save expenses', err)
    );
  }, [expenses, isLoaded]);

  const addExpense = async (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const addMember = async (name: string, role = 'member', emoji = '👦') => {
    const randomColor = AVATAR_COLORS[members.length % AVATAR_COLORS.length];
    const newMember: Member = {
      id: `m_${Date.now()}`,
      name: name.trim(),
      role,
      emoji,
      avatarColor: randomColor,
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const deleteMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const settleAll = async () => {
    // Settle resets balances or records settlement
    setExpenses([]);
  };

  const resetToDefaults = async () => {
    setMembers(DEFAULT_MEMBERS);
    setExpenses(DEFAULT_EXPENSES);
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const thisMonthExpenses = expenses
    .filter((item) => {
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const thisWeekExpenses = expenses
    .filter((item) => {
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && d >= sevenDaysAgo;
    })
    .reduce((sum, item) => sum + item.amount, 0);

  // Top Spender calculation
  const spenderMap: Record<string, number> = {};
  expenses.forEach((item) => {
    spenderMap[item.paidById] = (spenderMap[item.paidById] || 0) + item.amount;
  });

  let topSpenderMember: Member | null = null;
  let topSpenderAmount = 0;
  Object.entries(spenderMap).forEach(([memberId, amount]) => {
    if (amount > topSpenderAmount) {
      topSpenderAmount = amount;
      topSpenderMember = members.find((m) => m.id === memberId) || null;
    }
  });

  // Calculate member balances
  const memberBalances: MemberBalance[] = members.map((member) => {
    let totalPaid = 0;
    let totalShare = 0;

    expenses.forEach((exp) => {
      if (exp.paidById === member.id) {
        totalPaid += exp.amount;
      }

      if (exp.splitType === 'none') {
        if (exp.paidById === member.id) {
          totalShare += exp.amount;
        }
      } else if (exp.splitType === 'custom' && exp.customSplits) {
        totalShare += exp.customSplits[member.id] || 0;
      } else {
        // Equal split
        const participants = exp.splitMembers && exp.splitMembers.length > 0
          ? exp.splitMembers
          : members.map((m) => m.id);

        if (participants.includes(member.id)) {
          totalShare += exp.amount / participants.length;
        }
      }
    });

    const netBalance = totalPaid - totalShare;

    return {
      member,
      totalPaid,
      totalShare,
      netBalance,
    };
  });

  return (
    <ExpenseContext.Provider
      value={{
        members,
        expenses,
        memberBalances,
        totalExpenses,
        thisMonthExpenses,
        thisWeekExpenses,
        topSpender: { member: topSpenderMember, amount: topSpenderAmount },
        addExpense,
        deleteExpense,
        addMember,
        deleteMember,
        settleAll,
        resetToDefaults,
      }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
