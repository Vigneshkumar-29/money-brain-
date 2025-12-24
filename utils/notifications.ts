import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification handler to decide how to show the notification
// when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    } as any),
});

/**
 * Requests notification permissions from the user/system.
 * @returns {Promise<boolean>} true if granted
 */
export async function requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not already granted, ask for it
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

/**
 * Schedules a daily reminder notification at a specific time (default 8 PM).
 * @param hour Hour of the day (0-23)
 * @param minute Minute of the hour (0-59)
 */
export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<boolean> {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return false;

    // Cancel existing reminders to avoid duplicates
    await cancelDailyReminder();

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Time to log your expenses! 📝",
                body: "Don't forget to record today's transactions in Money Brain.",
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
        return true;
    } catch (e) {
        console.error("Error scheduling reminder:", e);
        return false;
    }
}

/**
 * Cancels all scheduled local notifications.
 */
export async function cancelDailyReminder() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Checks if expenses have exceeded 80% of income and triggers a notification if enabled.
 * @param income Total income
 * @param expense Total expense
 */
export async function checkBudgetExceeded(income: number, expense: number) {
    // 1. Check if "Budget Alerts" is enabled in preferences
    try {
        const stored = await AsyncStorage.getItem('notification_prefs');
        if (!stored) return;

        const { budgetAlerts } = JSON.parse(stored);
        if (!budgetAlerts) return;

        // 2. Calculate threshold
        // Avoid division by zero
        if (income <= 0) return;

        const ratio = expense / income;
        const threshold = 0.8; // 80%

        // 3. Trigger alert if threshold met
        // We only want to trigger this when the user adds a transaction that pushes them over.
        // Logic invokes this function AFTER a new transaction.
        if (ratio >= threshold) {
            const percentage = Math.round(ratio * 100);

            // Send immediate notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "⚠️ Budget Alert",
                    body: `Careful! You've used ${percentage}% of your total income.`,
                    data: { type: 'budget_alert' },
                },
                trigger: null, // send immediately
            });
        }
    } catch (e) {
        console.error("Error checking budget alert:", e);
    }
}
