import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MemberBalance } from '@/constants/ExpenseTypes';

interface MemberBalancesCardProps {
  balances: MemberBalance[];
  onSettleAll: () => void;
  onClearMemberExpenses?: (memberId: string) => void;
}

export function MemberBalancesCard({ balances, onSettleAll }: MemberBalancesCardProps) {
  const handleSettlePress = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm(
        'Are you sure you want to settle all debts and reset balances?'
      );
      if (confirm) onSettleAll();
    } else {
      Alert.alert(
        'Settle All Debts',
        'Are you sure you want to mark all member balances as settled?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settle All', style: 'destructive', onPress: onSettleAll },
        ]
      );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Member Balances</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={handleSettlePress} style={styles.settleBtn}>
            <Text style={styles.settleBtnText}>Settle All</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} hitSlop={6}>
            <FontAwesome name="eye-slash" size={15} color="#94a3b8" />
          </Pressable>
        </View>
      </View>

      <View style={styles.list}>
        {balances.map(({ member, netBalance }) => {
          const isOwed = netBalance > 0.005;
          const isOwes = netBalance < -0.005;
          const formattedAmount = Math.abs(netBalance).toFixed(2);

          let balanceText = 'Settled Rs0.00';
          let balanceColor = '#94a3b8';

          if (isOwed) {
            balanceText = `Owed Rs${formattedAmount}`;
            balanceColor = '#38bdf8'; // Blue/Cyan as shown in screenshot
          } else if (isOwes) {
            balanceText = `Owes Rs-${formattedAmount}`;
            balanceColor = '#f87171'; // Red/Coral as shown in screenshot
          }

          return (
            <View key={member.id} style={styles.balanceRow}>
              <View style={styles.memberInfo}>
                <View style={[styles.avatar, { backgroundColor: member.avatarColor }]}>
                  <Text style={styles.avatarEmoji}>{member.emoji}</Text>
                </View>
                <Text style={styles.name}>{member.name}</Text>
              </View>

              <View style={styles.rightSide}>
                <Text style={[styles.balanceText, { color: balanceColor }]}>{balanceText}</Text>
                <Pressable style={styles.trashBtn} hitSlop={6}>
                  <FontAwesome name="trash-o" size={15} color="#f87171" />
                </Pressable>
              </View>
            </View>
          );
        })}

        {balances.length === 0 && (
          <Text style={styles.emptyText}>No balances to display.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1b2234',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#26334d',
    flex: 1,
    minWidth: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settleBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  settleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    padding: 4,
  },
  list: {
    gap: 10,
  },
  balanceRow: {
    backgroundColor: '#232d42',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2f3c57',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 16,
  },
  name: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  rightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
  },
  trashBtn: {
    padding: 4,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
