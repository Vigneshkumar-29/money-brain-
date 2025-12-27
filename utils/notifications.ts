import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { formatCurrency } from './formatting';

// Storage keys
const LAST_BUDGET_ALERT_KEY = 'last_budget_alert_timestamp';
const NOTIFICATION_PREFS_KEY = 'notification_prefs';

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
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // If not already granted, ask for it
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        // Set up notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Money Brain Alerts',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#36e27b',
            });
        }

        return finalStatus === 'granted';
    } catch (e) {
        console.error("Error requesting permissions:", e);
        return false;
    }
}

/**
 * Check if notifications are currently enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch {
        return false;
    }
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
                data: { type: 'daily_reminder' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
        console.log(`Daily reminder scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
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
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
        console.error("Error canceling reminders:", e);
    }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications() {
    try {
        return await Notifications.getAllScheduledNotificationsAsync();
    } catch {
        return [];
    }
}

/**
 * Checks if we should suppress an alert based on recent alert history.
 * Prevents spamming the user with the same alert within 24 hours.
 */
async function shouldSuppressAlert(): Promise<boolean> {
    try {
        const lastAlert = await AsyncStorage.getItem(LAST_BUDGET_ALERT_KEY);
        if (!lastAlert) return false;

        const lastAlertTime = parseInt(lastAlert, 10);
        const now = Date.now();
        const hoursSinceLastAlert = (now - lastAlertTime) / (1000 * 60 * 60);

        // Suppress if alert was sent within the last 24 hours
        return hoursSinceLastAlert < 24;
    } catch {
        return false;
    }
}

/**
 * Record that we just sent a budget alert
 */
async function recordBudgetAlert() {
    try {
        await AsyncStorage.setItem(LAST_BUDGET_ALERT_KEY, Date.now().toString());
    } catch (e) {
        console.error("Error recording budget alert:", e);
    }
}

/**
 * Checks if expenses have exceeded threshold of income and triggers a notification if enabled.
 * Includes smart throttling to avoid duplicate alerts.
 * @param income Total income
 * @param expense Total expense
 */
export async function checkBudgetExceeded(income: number, expense: number) {
    try {
        // 1. Check if "Budget Alerts" is enabled in preferences
        const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (!stored) return;

        const { budgetAlerts } = JSON.parse(stored);
        if (!budgetAlerts) return;

        // 2. Check notification permissions
        const hasPermission = await areNotificationsEnabled();
        if (!hasPermission) return;

        // 3. Calculate threshold
        // Avoid division by zero
        if (income <= 0) return;

        const ratio = expense / income;
        const percentage = Math.round(ratio * 100);

        // 4. Check if we should suppress the alert (already sent recently)
        const suppress = await shouldSuppressAlert();
        if (suppress) {
            console.log("Budget alert suppressed - sent recently");
            return;
        }

        // 5. Trigger alert based on threshold levels
        let title = "";
        let body = "";

        if (ratio >= 1.0) {
            // Over budget!
            title = "🚨 Over Budget!";
            body = `You've exceeded your income by ${formatCurrency(expense - income)}. Total spending: ${percentage}% of income.`;
        } else if (ratio >= 0.9) {
            // 90% threshold - critical warning
            title = "⚠️ Critical: 90% Budget Used!";
            body = `You've used ${percentage}% of your income. Only ${formatCurrency(income - expense)} remaining.`;
        } else if (ratio >= 0.8) {
            // 80% threshold - warning
            title = "💰 Budget Alert: 80% Used";
            body = `You've used ${percentage}% of your total income. Consider slowing down spending.`;
        } else {
            // Below threshold, no alert needed
            return;
        }

        // 6. Send immediate notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                data: { type: 'budget_alert', percentage },
            },
            trigger: null, // send immediately
        });

        // 7. Record that we sent an alert
        await recordBudgetAlert();

        console.log(`Budget alert sent: ${percentage}%`);
    } catch (e) {
        console.error("Error checking budget alert:", e);
    }
}

/**
 * Send a test notification to verify the notification system is working.
 * Useful for debugging and user verification.
 */
export async function sendTestNotification(): Promise<boolean> {
    try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            console.log("No notification permission for test");
            return false;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "✅ Notifications Working!",
                body: "Great! You'll receive budget alerts and reminders from Money Brain.",
                sound: true,
                data: { type: 'test' },
            },
            trigger: null, // send immediately
        });

        return true;
    } catch (e) {
        console.error("Error sending test notification:", e);
        return false;
    }
}

/**
 * Reset the budget alert cooldown (for testing purposes)
 */
export async function resetBudgetAlertCooldown() {
    try {
        await AsyncStorage.removeItem(LAST_BUDGET_ALERT_KEY);
    } catch (e) {
        console.error("Error resetting budget alert cooldown:", e);
    }
}

