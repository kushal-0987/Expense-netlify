import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, role?: string, emoji?: string) => Promise<void>;
}

const EMOJI_CHOICES = ['👦', '👧', '👨', '👩', '🧑', '👵', '👴', '👶', '🐱'];

export function AddMemberModal({ visible, onClose, onAdd }: AddMemberModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [selectedEmoji, setSelectedEmoji] = useState('👦');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onAdd(name.trim(), role, selectedEmoji);
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <FontAwesome name="times" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>Member Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Kushal"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={styles.inputLabel}>Role</Text>
          <View style={styles.roleRow}>
            {['member', 'admin', 'guest'].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.rolePill, role === r && styles.rolePillActive]}>
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Avatar Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
            {EMOJI_CHOICES.map((e) => (
              <Pressable
                key={e}
                onPress={() => setSelectedEmoji(e)}
                style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnActive]}>
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.actionRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Add Member</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1b2234',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: '#2d3b55',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  inputLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  rolePillActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1d4ed8',
  },
  roleText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#ffffff',
  },
  emojiRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emojiBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  emojiText: {
    fontSize: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
