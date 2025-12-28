import React, { useEffect, useRef, memo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react-native';

interface OfflineBannerProps {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    syncError: string | null;
    onSyncPress?: () => void;
}

function OfflineBannerComponent({
    isOnline,
    pendingCount,
    isSyncing,
    syncError,
    onSyncPress,
}: OfflineBannerProps) {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const [isVisible, setIsVisible] = useState(false);

    // Determine if banner should show
    const shouldShow = !isOnline || (pendingCount > 0 && isSyncing) || !!syncError;

    useEffect(() => {
        if (shouldShow) {
            setIsVisible(true);
        }

        Animated.timing(slideAnim, {
            toValue: shouldShow ? 0 : -100,
            duration: 200,
            useNativeDriver: true,
        }).start(({ finished }) => {
            // Hide component after animation completes when hiding
            if (finished && !shouldShow) {
                setIsVisible(false);
            }
        });
    }, [shouldShow, slideAnim]);

    // Don't render anything if not visible (performance optimization)
    if (!isVisible && !shouldShow) {
        return null;
    }

    const getBannerConfig = () => {
        if (!isOnline) {
            return {
                backgroundColor: '#F59E0B',
                icon: <WifiOff size={18} color="#FFF" />,
                message: 'You\'re offline',
                subMessage: pendingCount > 0
                    ? `${pendingCount} pending`
                    : 'Changes sync when online',
            };
        }

        if (isSyncing && pendingCount > 0) {
            return {
                backgroundColor: '#3B82F6',
                icon: <ActivityIndicator size="small" color="#FFF" />,
                message: 'Syncing...',
                subMessage: `${pendingCount} remaining`,
            };
        }

        if (syncError) {
            return {
                backgroundColor: '#EF4444',
                icon: <AlertCircle size={18} color="#FFF" />,
                message: 'Sync failed',
                subMessage: 'Tap to retry',
            };
        }

        return null;
    };

    const config = getBannerConfig();
    if (!config) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: config.backgroundColor,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <TouchableOpacity
                style={styles.content}
                onPress={onSyncPress}
                disabled={!isOnline || isSyncing}
                activeOpacity={0.8}
            >
                <View style={styles.iconContainer}>
                    {config.icon}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.message}>{config.message}</Text>
                    <Text style={styles.subMessage}>{config.subMessage}</Text>
                </View>
                {isOnline && syncError && !isSyncing && (
                    <View style={styles.syncButton}>
                        <RefreshCw size={16} color="#FFF" />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// Memoize to prevent re-renders when parent updates
export const OfflineBanner = memo(OfflineBannerComponent, (prevProps, nextProps) => {
    return (
        prevProps.isOnline === nextProps.isOnline &&
        prevProps.pendingCount === nextProps.pendingCount &&
        prevProps.isSyncing === nextProps.isSyncing &&
        prevProps.syncError === nextProps.syncError
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingTop: 50,
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    message: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    subMessage: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    syncButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
