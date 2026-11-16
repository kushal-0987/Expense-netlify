import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, View, StyleSheet } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#0f172a',
          borderBottomColor: '#1e293b',
          borderBottomWidth: 1,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={styles.headerBtn} hitSlop={8}>
                <FontAwesome name="plus" size={14} color="#ffffff" />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={styles.headerBtn} hitSlop={8}>
                <FontAwesome name="plus" size={14} color="#ffffff" />
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});
