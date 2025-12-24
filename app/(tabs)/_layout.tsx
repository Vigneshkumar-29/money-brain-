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
import Animated, {
  useAnimatedStyle,
  interpolate,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// 1. Create the navigator instance
const { Navigator } = createMaterialTopTabNavigator();

// 2. Create the Expo Router compatible component
export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

// Colors
const ACTIVE_COLOR = '#36e27b';
const INACTIVE_COLOR = '#9CA3AF';

// Animated Tab Icon Component - now uses position-based animation
const TabIcon = ({
  progress,
  Icon,
  label,
}: {
  progress: Animated.SharedValue<number>;
  Icon: any;
  label: string;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.1]);
    const translateY = interpolate(progress.value, [0, 1], [0, -2]);
    const opacity = interpolate(progress.value, [0, 1], [0.7, 1]);

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  // Interpolate color based on progress
  const textStyle = useAnimatedStyle(() => {
    // We'll use opacity to blend between colors visually
    return {};
  });

  // Calculate color based on progress for the icon
  const iconColor = useAnimatedStyle(() => {
    return {};
  });

  return (
    <Animated.View style={[styles.tabItemContent, animatedStyle]}>
      <AnimatedIcon Icon={Icon} progress={progress} />
      <AnimatedLabel label={label} progress={progress} />
    </Animated.View>
  );
};

// Separate animated icon component for color interpolation
const AnimatedIcon = ({
  Icon,
  progress
}: {
  Icon: any;
  progress: Animated.SharedValue<number>;
}) => {
  const animatedProps = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0.7, 1]);
    return { opacity };
  });

  // For color, we need to use a workaround since RN doesn't support animated colors directly
  // We'll overlay two icons and animate their opacity
  return (
    <View style={{ position: 'relative' }}>
      <Animated.View style={[{ position: 'absolute' }, useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
      }))]}>
        {Icon && Icon({ color: INACTIVE_COLOR })}
      </Animated.View>
      <Animated.View style={useAnimatedStyle(() => ({
        opacity: progress.value,
      }))}>
        {Icon && Icon({ color: ACTIVE_COLOR })}
      </Animated.View>
    </View>
  );
};

// Animated label with color transition
const AnimatedLabel = ({
  label,
  progress
}: {
  label: string;
  progress: Animated.SharedValue<number>;
}) => {
  return (
    <View style={{ position: 'relative' }}>
      <Animated.View style={[{ position: 'absolute', width: '100%' }, useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
      }))]}>
        <Text style={[styles.label, { color: INACTIVE_COLOR }]}>{label}</Text>
      </Animated.View>
      <Animated.View style={useAnimatedStyle(() => ({
        opacity: progress.value,
      }))}>
        <Text style={[styles.label, { color: ACTIVE_COLOR }]}>{label}</Text>
      </Animated.View>
    </View>
  );
};

// Individual Tab Item with position-based animation
const TabItem = ({
  route,
  index,
  position,
  descriptors,
  navigation,
  state,
}: {
  route: any;
  index: number;
  position: Animated.SharedValue<number>;
  descriptors: any;
  navigation: any;
  state: any;
}) => {
  const { options } = descriptors[route.key];
  const label = options.title !== undefined ? options.title : route.name;
  const isFocused = state.index === index;

  // Create a derived progress value based on position
  // Progress is 1 when position equals this tab's index, 0 when far away
  const progress = useSharedValue(isFocused ? 1 : 0);

  // React to position changes in real-time
  useAnimatedReaction(
    () => position.value,
    (currentPosition) => {
      // Calculate how "focused" this tab is based on position
      // When currentPosition === index, progress = 1
      // When |currentPosition - index| >= 1, progress = 0
      const distance = Math.abs(currentPosition - index);
      const newProgress = Math.max(0, 1 - distance);
      progress.value = newProgress;
    },
    [index]
  );

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
        progress={progress}
        Icon={options.tabBarIcon}
        label={label}
      />
    </TouchableOpacity>
  );
};

// 3. Custom Tab Bar with real-time position tracking
function CustomTabBar({ state, descriptors, navigation, position }: any) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = Math.max(MIN_TOUCH_TARGET + rs(20), 73);
  const paddingBottom = Math.max(insets.bottom, rs(10));

  // Convert the position to a shared value for Reanimated
  const animatedPosition = useSharedValue(state.index);

  // Update position when it changes (position is an Animated.Value from react-navigation)
  React.useEffect(() => {
    if (position) {
      const listener = position.addListener(({ value }: { value: number }) => {
        animatedPosition.value = value;
      });
      return () => position.removeListener(listener);
    }
  }, [position]);

  // Also update when state.index changes (for tap navigation)
  React.useEffect(() => {
    animatedPosition.value = withTiming(state.index, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [state.index]);

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

      {/* Subtle Gradient Overlay/Border */}
      <View style={styles.borderTop} />

      <View style={[styles.contentContainer, {
        height: tabBarHeight + insets.bottom,
        paddingBottom: paddingBottom,
        paddingTop: rs(12),
      }]}>
        {state.routes.map((route: any, index: number) => (
          <TabItem
            key={route.key}
            route={route}
            index={index}
            position={animatedPosition}
            descriptors={descriptors}
            navigation={navigation}
            state={state}
          />
        ))}
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
