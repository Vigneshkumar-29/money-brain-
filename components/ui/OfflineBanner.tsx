import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react-native';

interface OfflineBannerProps {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    syncError: string | null;
    onSyncPress?: () => void;
}

export function OfflineBanner({
    isOnline,
    pendingCount,
    isSyncing,
    syncError,
    onSyncPress,
}: OfflineBannerProps) {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Determine if banner should show
    const shouldShow = !isOnline || pendingCount > 0 || isSyncing || syncError;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: shouldShow ? 0 : -100,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
        }).start();
    }, [shouldShow, slideAnim]);

    // Pulse animation for syncing
    useEffect(() => {
        if (isSyncing) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.7,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isSyncing, pulseAnim]);

    const getBannerConfig = () => {
        if (!isOnline) {
            return {
                backgroundColor: '#F59E0B',
                icon: <WifiOff size={18} color="#FFF" />,
                message: 'You\'re offline',
                subMessage: pendingCount > 0
                    ? `${pendingCount} pending transaction${pendingCount > 1 ? 's' : ''}`
                    : 'Changes will sync when online',
            };
        }

        if (isSyncing) {
            return {
                backgroundColor: '#3B82F6',
                icon: <ActivityIndicator size="small" color="#FFF" />,
                message: 'Syncing...',
                subMessage: `Uploading ${pendingCount} transaction${pendingCount > 1 ? 's' : ''}`,
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

        if (pendingCount > 0) {
            return {
                backgroundColor: '#10B981',
                icon: <RefreshCw size={18} color="#FFF" />,
                message: 'Ready to sync',
                subMessage: `${pendingCount} pending transaction${pendingCount > 1 ? 's' : ''}`,
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
                    opacity: pulseAnim,
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
                {isOnline && pendingCount > 0 && !isSyncing && (
                    <View style={styles.syncButton}>
                        <RefreshCw size={16} color="#FFF" />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
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
