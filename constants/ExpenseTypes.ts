export interface Member {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  emoji: string;
}

export type SplitType = 'equal' | 'custom' | 'none';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  categoryEmoji: string;
  date: string; // e.g. "2026-10-06" or ISO
  time: string; // e.g. "10:42:57 PM"
  paidById: string; // Member id
  splitType: SplitType;
  splitMembers: string[]; // Member ids involved
  customSplits?: Record<string, number>; // memberId -> amount
}

export interface MemberBalance {
  member: Member;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // positive = owed (gets money back), negative = owes (needs to pay)
}

export interface CategoryOption {
  name: string;
  emoji: string;
}

export const CATEGORIES: CategoryOption[] = [
  { name: 'Food', emoji: '🍽️' },
  { name: 'Groceries', emoji: '🛒' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Bills', emoji: '💡' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Entertainment', emoji: '🍿' },
  { name: 'Health', emoji: '🏥' },
  { name: 'Rent', emoji: '🏠' },
  { name: 'Other', emoji: '📦' },
];

export const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];
