import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Dimensions } from 'react-native';
import { Home, BarChart2, Wallet, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { rfs, rs, getIconSize, MIN_TOUCH_TARGET } from '../../lib/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Calculate responsive tab bar height
  const tabBarHeight = Math.max(MIN_TOUCH_TARGET + rs(20), 70);
  const iconSize = getIconSize(24);
  const labelFontSize = rfs(10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(5, 10, 7, 0.9)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          height: tabBarHeight + insets.bottom,
          paddingBottom: Math.max(insets.bottom, rs(5)),
          paddingTop: rs(10),
          paddingHorizontal: rs(8),
          elevation: 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={{ flex: 1, backgroundColor: 'rgba(5, 10, 7, 0.5)' }} />
          ) : null
        ),
        tabBarActiveTintColor: '#36e27b',
        tabBarInactiveTintColor: '#6B7280',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: 'Syne',
          fontSize: labelFontSize,
          marginBottom: rs(5),
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: rs(5),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <BarChart2 size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Wallet', // Renaming per design implies Wallet
          tabBarIcon: ({ color }) => <Wallet size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}
