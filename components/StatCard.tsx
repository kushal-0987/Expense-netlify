import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor: string;
}

export function StatCard({ label, value, subValue, iconName, iconColor }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {subValue && (
          <Text style={styles.subValue} numberOfLines={1}>
            {subValue}
          </Text>
        )}
      </View>
      <View style={[styles.iconBox, { borderColor: iconColor }]}>
        <FontAwesome name={iconName} size={18} color={iconColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1b2234',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26334d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 180,
    flex: 1,
  },
  textCol: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  value: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  subValue: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
