import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useExpenses } from '@/context/ExpenseContext';
import { ExpenseCard } from '@/components/ExpenseCard';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { CATEGORIES } from '@/constants/ExpenseTypes';

export default function ExpensesScreen() {
  const { members, expenses, deleteExpense, addExpense } = useExpenses();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMember, setSelectedMember] = useState<string>('All');
  const [addModalVisible, setAddModalVisible] = useState(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Search
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      // Member filter (paid by or in split)
      const matchesMember =
        selectedMember === 'All' ||
        item.paidById === selectedMember ||
        (item.splitMembers && item.splitMembers.includes(selectedMember));

      return matchesSearch && matchesCategory && matchesMember;
    });
  }, [expenses, searchQuery, selectedCategory, selectedMember]);

  const totalFilteredAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>All Expenses</Text>
          <Text style={styles.subtitle}>
            {filteredExpenses.length} transaction(s) • Total: ₨{totalFilteredAmount.toFixed(2)}
          </Text>
        </View>

        <Pressable
          onPress={() => setAddModalVisible(true)}
          style={styles.addBtn}>
          <FontAwesome name="plus" size={14} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Expense</Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <FontAwesome name="search" size={16} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, item or category..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <FontAwesome name="times-circle" size={16} color="#64748b" />
          </Pressable>
        ) : null}
      </View>

      {/* Category Pills */}
      <Text style={styles.filterLabel}>Filter by Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <Pressable
          onPress={() => setSelectedCategory('All')}
          style={[styles.filterPill, selectedCategory === 'All' && styles.filterPillActive]}>
          <Text style={[styles.filterPillText, selectedCategory === 'All' && styles.filterPillTextActive]}>
            All
          </Text>
        </Pressable>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <Pressable
              key={cat.name}
              onPress={() => setSelectedCategory(cat.name)}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}>
              <Text style={styles.filterPillEmoji}>{cat.emoji}</Text>
              <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Member Filter Pills */}
      <Text style={styles.filterLabel}>Filter by Member</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <Pressable
          onPress={() => setSelectedMember('All')}
          style={[styles.filterPill, selectedMember === 'All' && styles.filterPillActive]}>
          <Text style={[styles.filterPillText, selectedMember === 'All' && styles.filterPillTextActive]}>
            All Members
          </Text>
        </Pressable>

        {members.map((m) => {
          const isSelected = selectedMember === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setSelectedMember(m.id)}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}>
              <Text style={styles.filterPillEmoji}>{m.emoji}</Text>
              <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                {m.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Expense List */}
      <View style={styles.list}>
        {filteredExpenses.map((exp) => (
          <ExpenseCard
            key={exp.id}
            expense={exp}
            members={members}
            onDelete={deleteExpense}
          />
        ))}

        {filteredExpenses.length === 0 && (
          <View style={styles.emptyCard}>
            <FontAwesome name="search-minus" size={32} color="#475569" />
            <Text style={styles.emptyTitle}>No matching expenses found</Text>
            <Text style={styles.emptySubtitle}>
              Try clearing filters or search query to see all expenses.
            </Text>
          </View>
        )}
      </View>

      <AddExpenseModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        members={members}
        onAdd={addExpense}
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
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 6,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  filterPillEmoji: {
    fontSize: 12,
    marginRight: 6,
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  list: {
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#1b2234',
    borderRadius: 14,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26334d',
    marginTop: 16,
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
