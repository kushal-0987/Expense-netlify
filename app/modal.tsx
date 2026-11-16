import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useExpenses } from '@/context/ExpenseContext';
import { CATEGORIES, SplitType } from '@/constants/ExpenseTypes';

export default function ModalScreen() {
  const { members, addExpense } = useExpenses();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [paidById, setPaidById] = useState(members[0]?.id || '1');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map((m) => m.id));
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const toggleMemberInSplit = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
      }
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleCustomSplitChange = (memberId: string, val: string) => {
    setCustomSplits((prev) => ({
      ...prev,
      [memberId]: val,
    }));
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const parsedCustomSplits: Record<string, number> = {};
    if (splitType === 'custom') {
      members.forEach((m) => {
        parsedCustomSplits[m.id] = parseFloat(customSplits[m.id] || '0') || 0;
      });
    }

    await addExpense({
      title: title.trim(),
      amount: numAmount,
      category: selectedCategory.name,
      categoryEmoji: selectedCategory.emoji,
      date: date || now.toISOString().split('T')[0],
      time: timeStr,
      paidById: paidById || members[0]?.id || '1',
      splitType,
      splitMembers: splitType === 'none' ? [paidById] : selectedMembers,
      customSplits: splitType === 'custom' ? parsedCustomSplits : undefined,
    });

    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Add New Expense</Text>
      <Text style={styles.subheading}>Record a transaction and distribute balances</Text>

      {/* Title */}
      <Text style={styles.inputLabel}>Title / Description</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. dudh biscuit ( duso)"
        placeholderTextColor="#64748b"
        value={title}
        onChangeText={setTitle}
      />

      {/* Amount & Date */}
      <View style={styles.twoColRow}>
        <View style={styles.col}>
          <Text style={styles.inputLabel}>Amount (₨)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 80.00"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.col}>
          <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="2026-10-06"
            placeholderTextColor="#64748b"
            value={date}
            onChangeText={setDate}
          />
        </View>
      </View>

      {/* Category selection */}
      <Text style={styles.inputLabel}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory.name === cat.name;
          return (
            <Pressable
              key={cat.name}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.categoryPill, isSelected && styles.categoryPillActive]}>
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Paid By Selection */}
      <Text style={styles.inputLabel}>Paid By</Text>
      <View style={styles.membersRow}>
        {members.map((m) => {
          const isSelected = paidById === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => setPaidById(m.id)}
              style={[styles.memberPill, isSelected && styles.memberPillActive]}>
              <View style={[styles.memberAvatar, { backgroundColor: m.avatarColor }]}>
                <Text style={styles.memberAvatarEmoji}>{m.emoji}</Text>
              </View>
              <Text style={[styles.memberNameText, isSelected && styles.memberNameActive]}>
                {m.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Split Mode */}
      <Text style={styles.inputLabel}>Split Mode</Text>
      <View style={styles.splitTypeRow}>
        <Pressable
          onPress={() => setSplitType('equal')}
          style={[styles.splitTypeBtn, splitType === 'equal' && styles.splitTypeBtnActive]}>
          <Text
            style={[styles.splitTypeText, splitType === 'equal' && styles.splitTypeTextActive]}>
            Equal Split
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSplitType('custom')}
          style={[styles.splitTypeBtn, splitType === 'custom' && styles.splitTypeBtnActive]}>
          <Text
            style={[styles.splitTypeText, splitType === 'custom' && styles.splitTypeTextActive]}>
            Custom Split
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSplitType('none')}
          style={[styles.splitTypeBtn, splitType === 'none' && styles.splitTypeBtnActive]}>
          <Text
            style={[styles.splitTypeText, splitType === 'none' && styles.splitTypeTextActive]}>
            No Split
          </Text>
        </Pressable>
      </View>

      {/* Split Details */}
      {splitType === 'equal' && (
        <View style={styles.splitBox}>
          <Text style={styles.splitSubhead}>Split equally among:</Text>
          <View style={styles.checkboxGroup}>
            {members.map((m) => {
              const isChecked = selectedMembers.includes(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMemberInSplit(m.id)}
                  style={[styles.checkboxRow, isChecked && styles.checkboxRowActive]}>
                  <FontAwesome
                    name={isChecked ? 'check-square' : 'square-o'}
                    size={18}
                    color={isChecked ? '#10b981' : '#64748b'}
                  />
                  <Text style={styles.checkboxText}>
                    {m.emoji} {m.name}
                  </Text>
                  {isChecked && (
                    <Text style={styles.sharePreview}>
                      ₨
                      {amount && !isNaN(parseFloat(amount)) && selectedMembers.length > 0
                        ? (parseFloat(amount) / selectedMembers.length).toFixed(2)
                        : '0.00'}{' '}
                      each
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {splitType === 'custom' && (
        <View style={styles.splitBox}>
          <Text style={styles.splitSubhead}>Enter amount per member:</Text>
          {members.map((m) => (
            <View key={m.id} style={styles.customSplitRow}>
              <Text style={styles.customSplitName}>
                {m.emoji} {m.name}
              </Text>
              <TextInput
                style={styles.customSplitInput}
                placeholder="0.00"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={customSplits[m.id] || ''}
                onChangeText={(val) => handleCustomSplitChange(m.id, val)}
              />
            </View>
          ))}
        </View>
      )}

      {splitType === 'none' && (
        <View style={styles.splitBox}>
          <Text style={styles.splitSubhead}>
            Only the payer will bear this expense.
          </Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSubmit} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Save Expense</Text>
        </Pressable>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subheading: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberPillActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  memberAvatarEmoji: {
    fontSize: 12,
  },
  memberNameText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  memberNameActive: {
    color: '#ffffff',
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  splitTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  splitTypeBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  splitTypeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  splitTypeTextActive: {
    color: '#ffffff',
  },
  splitBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginTop: 12,
  },
  splitSubhead: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 8,
  },
  checkboxGroup: {
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  checkboxRowActive: {
    backgroundColor: '#0f172a',
  },
  checkboxText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  sharePreview: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  customSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customSplitName: {
    color: '#ffffff',
    fontSize: 13,
    flex: 1,
  },
  customSplitInput: {
    width: 100,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
