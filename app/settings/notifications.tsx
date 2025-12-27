import { View, Text, Switch, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellRing, Clock, AlertTriangle, Zap } from 'lucide-react-native';
import FadeInView from '../../components/ui/FadeInView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { scheduleDailyReminder, cancelDailyReminder, requestPermissions, sendTestNotification } from '../../utils/notifications';

// Check if running in Expo Go (where push notifications are not supported in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';



export default function NotificationSettings() {
    const router = useRouter();
    const [enabled, setEnabled] = useState(false);
    const [dailyReminder, setDailyReminder] = useState(false);
    const [budgetAlerts, setBudgetAlerts] = useState(false);
    const [testing, setTesting] = useState(false);
    // const [notificationsAvailable] = useState(!isExpoGo); // Unused state setter, just use isExpoGo or initialized val
    const notificationsAvailable = !isExpoGo;

    useEffect(() => {
        if (notificationsAvailable) {
            checkPermissions();
        }
        loadPreferences();
    }, [notificationsAvailable]);

    async function checkPermissions() {
        const granted = await requestPermissions();
        setEnabled(granted);
    }

    async function loadPreferences() {
        try {
            const stored = await AsyncStorage.getItem('notification_prefs');
            if (stored) {
                const prefs = JSON.parse(stored);
                setDailyReminder(prefs.dailyReminder);
                setBudgetAlerts(prefs.budgetAlerts);
            }
        } catch { }
    }

    async function savePreferences(key: string, value: boolean) {
        try {
            const current = { dailyReminder, budgetAlerts, [key]: value };

            // Handle side effects for Daily Reminder
            if (key === 'dailyReminder') {
                if (value) {
                    await scheduleDailyReminder();
                } else {
                    await cancelDailyReminder();
                }
            }

            await AsyncStorage.setItem('notification_prefs', JSON.stringify(current));
        } catch { }
    }

    async function toggleNotifications(value: boolean) {
        // Allow trying even in Expo Go for local notifications,
        // but keep the check if we want to be strict about push.
        // For now, let's just use requestPermissions which handles local.

        if (value) {
            const granted = await requestPermissions();
            setEnabled(granted);
            if (!granted) {
                Alert.alert('Permission Required', 'Please enable notifications in your system settings.');
                return;
            }
        } else {
            // We can't actually disable system permissions programmatically, just our local "toggle" state visually
            Alert.alert('System Settings', 'To disable notifications, please go to your device settings.');
        }
    }

    async function handleTestNotification() {
        if (testing) return;
        setTesting(true);
        try {
            const success = await sendTestNotification();
            if (!success) {
                Alert.alert('Test Failed', 'Could not send test notification. Please check notification permissions.');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to send test notification.');
        } finally {
            setTesting(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
                >
                    <ArrowLeft size={24} color="#9CA3AF" />
                </Pressable>
                <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">Notifications</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <FadeInView>
                    {/* Expo Go Warning Banner */}
                    {!notificationsAvailable && (
                        <View className="bg-amber-500/20 border border-amber-500/40 p-4 rounded-2xl flex-row items-center gap-3 mb-4">
                            <AlertTriangle size={24} color="#F59E0B" />
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-amber-600 dark:text-amber-400">Limited in Expo Go</Text>
                                <Text className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                                    Push notifications require a development build. Local settings will still be saved.
                                </Text>
                            </View>
                        </View>
                    )}

                    <View className="bg-primary/10 p-5 rounded-2xl flex-row items-center gap-4 mb-8">
                        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                            <BellRing size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-text-primary dark:text-text-dark font-display">Push Notifications</Text>
                            <Text className="text-xs text-text-secondary mt-1">Receive updates about your expenses and budget.</Text>
                        </View>
                        <Switch
                            value={enabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#E5E7EB', true: '#2ECC71' }}
                        />
                    </View>

                    <Text className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">Preferences</Text>

                    <View className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

                        <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 items-center justify-center">
                                    <Clock size={20} color="#F97316" />
                                </View>
                                <View>
                                    <Text className="font-semibold text-text-primary dark:text-text-dark font-body">Daily Reminder</Text>
                                    <Text className="text-xs text-text-secondary">Remind me to log expenses at 8 PM</Text>
                                </View>
                            </View>
                            <Switch
                                disabled={!enabled}
                                value={dailyReminder}
                                onValueChange={(v) => { setDailyReminder(v); savePreferences('dailyReminder', v); }}
                                trackColor={{ false: '#E5E7EB', true: '#2ECC71' }}
                            />
                        </View>

                        <View className="flex-row items-center justify-between p-4">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 items-center justify-center">
                                    <Bell size={20} color="#EF4444" />
                                </View>
                                <View>
                                    <Text className="font-semibold text-text-primary dark:text-text-dark font-body">Budget Alerts</Text>
                                    <Text className="text-xs text-text-secondary">Notify when 80% of budget reached</Text>
                                </View>
                            </View>
                            <Switch
                                disabled={!enabled}
                                value={budgetAlerts}
                                onValueChange={(v) => { setBudgetAlerts(v); savePreferences('budgetAlerts', v); }}
                                trackColor={{ false: '#E5E7EB', true: '#2ECC71' }}
                            />
                        </View>

                    </View>

                    {/* Test Notification Button */}
                    <Pressable
                        onPress={handleTestNotification}
                        disabled={!enabled || testing}
                        className={`mt-6 py-4 px-6 rounded-2xl flex-row items-center justify-center gap-3 ${enabled ? 'bg-primary' : 'bg-gray-400'} ${testing ? 'opacity-60' : ''}`}
                    >
                        {testing ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Zap size={20} color="white" />
                        )}
                        <Text className="text-white font-bold font-display">
                            {testing ? 'Sending...' : 'Send Test Notification'}
                        </Text>
                    </Pressable>
                    <Text className="text-xs text-text-secondary text-center mt-2">
                        Tap to verify notifications are working correctly
                    </Text>
                </FadeInView>
            </ScrollView>
        </SafeAreaView>
    );
}
