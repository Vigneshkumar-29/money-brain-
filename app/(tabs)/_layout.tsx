import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import React from 'react';
import { Platform, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, BarChart2, Wallet, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { rfs, rs, getIconSize, MIN_TOUCH_TARGET } from '../../lib/responsive';
import Animated, { useAnimatedStyle, withSpring, interpolate, useDerivedValue, withTiming } from 'react-native-reanimated';

// 1. Create the navigator instance
const { Navigator } = createMaterialTopTabNavigator();

// 2. Create the Expo Router compatible component
export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

// Animated Tab Icon Component for that "Professional" feel
const TabIcon = ({
  isFocused,
  Icon,
  label,
  color
}: {
  isFocused: boolean;
  Icon: any;
  label: string;
  color: string;
}) => {
  const progress = useDerivedValue(() => {
    return isFocused ? withSpring(1) : withTiming(0);
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(progress.value, [0, 1], [1, 1.1]) },
        { translateY: interpolate(progress.value, [0, 1], [0, -2]) }
      ],
      opacity: interpolate(progress.value, [0, 1], [0.7, 1]),
    };
  });

  return (
    <Animated.View style={[styles.tabItemContent, animatedStyle]}>
      {Icon && Icon({ color })}
      <Text style={[styles.label, { color }]}>
        {label}
      </Text>
    </Animated.View>
  );
};

// 3. Custom Tab Bar to replace the default one
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = Math.max(MIN_TOUCH_TARGET + rs(20), 73); // Slightly taller for better touch
  const paddingBottom = Math.max(insets.bottom, rs(10));

  return (
    <View style={styles.tabBarContainer}>
      {/* Glassmorphism Background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={80}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5, 10, 7, 0.95)' }]} />
      )}

      {/* Subtle Gradient Overly/Border */}
      <View style={styles.borderTop} />

      <View style={[styles.contentContainer, {
        height: tabBarHeight + insets.bottom,
        paddingBottom: paddingBottom,
        paddingTop: rs(12),
      }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const color = isFocused ? '#36e27b' : '#9CA3AF'; // Brighter active, softer inactive

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <TabIcon
                isFocused={isFocused}
                Icon={options.tabBarIcon}
                label={label}
                color={color}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(5, 10, 7, 0.95)',
    elevation: 0,
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentContainer: {
    flexDirection: 'row',
    paddingHorizontal: rs(10),
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Syne',
    fontSize: rfs(10),
    marginTop: rs(6),
    fontWeight: '500',
  }
});

export default function TabLayout() {
  const iconSize = getIconSize(24);

  return (
    <MaterialTopTabs
      tabBar={(props) => <CustomTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        tabBarIndicatorStyle: { height: 0 }, // Hide default indicator
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: any) => <Home size={iconSize} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="charts"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }: any) => <BarChart2 size={iconSize} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="transactions"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }: any) => <Wallet size={iconSize} color={color} />,
        }}
      />
      <MaterialTopTabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }: any) => <Settings size={iconSize} color={color} />,
        }}
      />
    </MaterialTopTabs>
  );
}
