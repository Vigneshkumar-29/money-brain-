import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring } from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
  className?: string;
}

export default function FadeInView({ children, delay = 0, style, className }: FadeInViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 400 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]} className={className}>
      {children}
    </Animated.View>
  );
}
