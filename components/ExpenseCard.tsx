import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Expense, Member } from '@/constants/ExpenseTypes';

interface ExpenseCardProps {
  expense: Expense;
  members: Member[];
  onDelete: (id: string) => void;
}

export function ExpenseCard({ expense, members, onDelete }: ExpenseCardProps) {
  const payer = members.find((m) => m.id === expense.paidById);
  const payerName = payer ? payer.name : 'Unknown';
  const payerEmoji = payer ? payer.emoji : '👤';
  const payerColor = payer ? payer.avatarColor : '#3b82f6';

  let splitText = 'No Split';
  if (expense.splitType === 'equal') {
    const count = expense.splitMembers ? expense.splitMembers.length : members.length;
    splitText = `Split (${count} members)`;
  } else if (expense.splitType === 'custom') {
    splitText = 'Custom Split';
  }

  // Format date display
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.avatar, { backgroundColor: payerColor }]}>
            <Text style={styles.avatarEmoji}>{payerEmoji}</Text>
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {expense.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {expense.categoryEmoji} {expense.category}
              </Text>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.metaText}>{formatDate(expense.date)}</Text>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.metaText}>{payerName}</Text>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.splitBadge}>{splitText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountCol}>
          <Text style={styles.amountText}>₨{expense.amount.toFixed(2)}</Text>
          <Text style={styles.timeText}>{expense.time || '12:00:00 PM'}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.splitMembersRow}>
          {expense.splitType !== 'none' && expense.splitMembers && (
            <View style={styles.memberPillsContainer}>
              {expense.splitMembers.map((mId) => {
                const member = members.find((m) => m.id === mId);
                if (!member) return null;
                return (
                  <View key={mId} style={styles.memberMiniPill}>
                    <Text style={styles.memberMiniText}>
                      {member.emoji} {member.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => onDelete(expense.id)}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}>
          <FontAwesome name="trash-o" size={16} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  bullet: {
    color: '#64748b',
    marginHorizontal: 5,
    fontSize: 12,
  },
  splitBadge: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '500',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    color: '#10b981',
    fontSize: 17,
    fontWeight: '800',
  },
  timeText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  splitMembersRow: {
    flex: 1,
  },
  memberPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberMiniPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  memberMiniText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 10,
  },
});
