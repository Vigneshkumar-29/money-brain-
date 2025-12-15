import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/**
 * Responsive width based on screen width
 * @param size - Size in pixels from design
 * @returns Scaled size for current device
 */
export const wp = (size: number): number => {
    return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Responsive height based on screen height
 * @param size - Size in pixels from design
 * @returns Scaled size for current device
 */
export const hp = (size: number): number => {
    return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Responsive font size
 * @param size - Font size in pixels
 * @returns Scaled font size
 */
export const rfs = (size: number): number => {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive spacing
 * @param size - Spacing size
 * @returns Scaled spacing
 */
export const rs = (size: number): number => {
    return Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);
};

/**
 * Check if device is small (width < 375)
 */
export const isSmallDevice = (): boolean => {
    return SCREEN_WIDTH < 375;
};

/**
 * Check if device is medium (375 <= width < 414)
 */
export const isMediumDevice = (): boolean => {
    return SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
};

/**
 * Check if device is large (width >= 414)
 */
export const isLargeDevice = (): boolean => {
    return SCREEN_WIDTH >= 414;
};

/**
 * Get device size category
 */
export const getDeviceSize = (): 'small' | 'medium' | 'large' => {
    if (isSmallDevice()) return 'small';
    if (isMediumDevice()) return 'medium';
    return 'large';
};

/**
 * Responsive padding for containers
 */
export const containerPadding = {
    small: rs(16),
    medium: rs(20),
    large: rs(24),
};

/**
 * Get appropriate padding based on device size
 */
export const getContainerPadding = (): number => {
    const size = getDeviceSize();
    return containerPadding[size];
};

/**
 * Minimum touch target size (44x44 for iOS, 48x48 for Android)
 */
export const MIN_TOUCH_TARGET = Platform.OS === 'ios' ? 44 : 48;

/**
 * Ensure minimum touch target size
 */
export const ensureTouchTarget = (size: number): number => {
    return Math.max(size, MIN_TOUCH_TARGET);
};

/**
 * Get responsive icon size
 */
export const getIconSize = (base: number = 24): number => {
    const size = getDeviceSize();
    const multiplier = size === 'small' ? 0.9 : size === 'large' ? 1.1 : 1;
    return Math.round(base * multiplier);
};

/**
 * Get responsive border radius
 */
export const getBorderRadius = (base: number): number => {
    return rs(base);
};

/**
 * Screen dimensions
 */
export const SCREEN = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: isSmallDevice(),
    isMedium: isMediumDevice(),
    isLarge: isLargeDevice(),
};

/**
 * Typography scale
 */
export const typography = {
    xs: rfs(10),
    sm: rfs(12),
    base: rfs(14),
    lg: rfs(16),
    xl: rfs(18),
    '2xl': rfs(20),
    '3xl': rfs(24),
    '4xl': rfs(32),
    '5xl': rfs(40),
    '6xl': rfs(48),
};

/**
 * Spacing scale
 */
export const spacing = {
    xs: rs(4),
    sm: rs(8),
    md: rs(12),
    lg: rs(16),
    xl: rs(20),
    '2xl': rs(24),
    '3xl': rs(32),
    '4xl': rs(40),
    '5xl': rs(48),
};
