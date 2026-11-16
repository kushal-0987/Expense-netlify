import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useExpenses } from '@/context/ExpenseContext';
import { StatCard } from '@/components/StatCard';
import { FamilyMembersCard } from '@/components/FamilyMembersCard';
import { MemberBalancesCard } from '@/components/MemberBalancesCard';
import { ExpenseCard } from '@/components/ExpenseCard';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { AddMemberModal } from '@/components/AddMemberModal';

export default function DashboardScreen() {
  const {
    members,
    expenses,
    memberBalances,
    totalExpenses,
    thisMonthExpenses,
    thisWeekExpenses,
    topSpender,
    addExpense,
    deleteExpense,
    addMember,
    deleteMember,
    settleAll,
  } = useExpenses();

  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [addMemberVisible, setAddMemberVisible] = useState(false);

  // Format currency
  const formatRs = (amount: number) => {
    return `Rs${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Top Banner / Welcome & Quick Action */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>Family Expense Tracker</Text>
          <Text style={styles.pageSubtitle}>Manage shared spending, splits, and balances</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            onPress={() => setAddMemberVisible(true)}
            style={styles.secondaryBtn}>
            <FontAwesome name="user-plus" size={14} color="#60a5fa" />
            <Text style={styles.secondaryBtnText}>Add Member</Text>
          </Pressable>

          <Pressable
            onPress={() => setAddExpenseVisible(true)}
            style={styles.primaryBtn}>
            <FontAwesome name="plus" size={14} color="#ffffff" />
            <Text style={styles.primaryBtnText}>Add Expense</Text>
          </Pressable>
        </View>
      </View>

      {/* Metric Cards Row */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Expenses"
          value={formatRs(totalExpenses)}
          iconName="dollar"
          iconColor="#818cf8"
        />
        <StatCard
          label="This Month"
          value={formatRs(thisMonthExpenses)}
          iconName="calendar-check-o"
          iconColor="#10b981"
        />
        <StatCard
          label="This Week"
          value={formatRs(thisWeekExpenses)}
          iconName="calendar"
          iconColor="#f59e0b"
        />
        <StatCard
          label="Top Spender"
          value={topSpender.member ? topSpender.member.name : 'None'}
          subValue={topSpender.amount > 0 ? formatRs(topSpender.amount) : undefined}
          iconName="bar-chart"
          iconColor="#c084fc"
        />
        <StatCard
          label="Active Members"
          value={members.length.toString()}
          iconName="users"
          iconColor="#38bdf8"
        />
      </View>

      {/* Two-Column Layout for Family Members & Member Balances */}
      <View style={styles.panelsRow}>
        <FamilyMembersCard
          members={members}
          onAddPress={() => setAddMemberVisible(true)}
          onDeletePress={deleteMember}
        />
        <MemberBalancesCard
          balances={memberBalances}
          onSettleAll={settleAll}
        />
      </View>

      {/* Recent Expenses List */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <Text style={styles.sectionSubtitle}>Latest shared & individual transactions</Text>
        </View>
        <Pressable
          onPress={() => setAddExpenseVisible(true)}
          style={styles.addExpenseInlineBtn}>
          <FontAwesome name="plus-circle" size={16} color="#10b981" />
          <Text style={styles.addExpenseInlineText}>New Expense</Text>
        </Pressable>
      </View>

      <View style={styles.expensesList}>
        {expenses.slice(0, 10).map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            members={members}
            onDelete={deleteExpense}
          />
        ))}

        {expenses.length === 0 && (
          <View style={styles.emptyCard}>
            <FontAwesome name="file-text-o" size={36} color="#475569" />
            <Text style={styles.emptyTitle}>No expenses recorded yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Expense" to track your first shared expense!
            </Text>
          </View>
        )}
      </View>

      {/* Modals */}
      <AddExpenseModal
        visible={addExpenseVisible}
        onClose={() => setAddExpenseVisible(false)}
        members={members}
        onAdd={addExpense}
      />

      <AddMemberModal
        visible={addMemberVisible}
        onClose={() => setAddMemberVisible(false)}
        onAdd={addMember}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  secondaryBtnText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  panelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  addExpenseInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  addExpenseInlineText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 13,
  },
  expensesList: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: '#1b2234',
    borderRadius: 14,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26334d',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
