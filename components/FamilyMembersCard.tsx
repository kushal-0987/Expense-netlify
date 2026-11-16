import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Member } from '@/constants/ExpenseTypes';

interface FamilyMembersCardProps {
  members: Member[];
  onAddPress: () => void;
  onDeletePress: (id: string) => void;
}

export function FamilyMembersCard({ members, onAddPress, onDeletePress }: FamilyMembersCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Members</Text>
        <Pressable onPress={onAddPress} style={styles.addBtn} hitSlop={10}>
          <FontAwesome name="user-plus" size={16} color="#60a5fa" />
        </Pressable>
      </View>

      <View style={styles.list}>
        {members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <View style={[styles.avatar, { backgroundColor: member.avatarColor }]}>
                <Text style={styles.avatarEmoji}>{member.emoji}</Text>
              </View>
              <View>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.role}>{member.role}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.iconBtn} hitSlop={6}>
                <FontAwesome name="eye" size={15} color="#94a3b8" />
              </Pressable>
              <Pressable
                onPress={() => onDeletePress(member.id)}
                style={styles.iconBtn}
                hitSlop={6}>
                <FontAwesome name="trash-o" size={15} color="#f87171" />
              </Pressable>
            </View>
          </View>
        ))}

        {members.length === 0 && (
          <Text style={styles.emptyText}>No members added yet. Click + to add family members.</Text>
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
  addBtn: {
    padding: 6,
  },
  list: {
    gap: 10,
  },
  memberRow: {
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
  role: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
