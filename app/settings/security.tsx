import { View, Text, Switch, Pressable, Alert, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Fingerprint, Lock, Smartphone } from 'lucide-react-native';
import FadeInView from '../../components/ui/FadeInView';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SecuritySettings() {
    const router = useRouter();
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        checkSupport();
        loadPreferences();
    }, []);

    async function checkSupport() {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsSupported(compatible && enrolled);
    }

    async function loadPreferences() {
        const stored = await AsyncStorage.getItem('biometrics_enabled');
        setBiometricsEnabled(stored === 'true');
    }

    async function toggleBiometrics(value: boolean) {
        if (value) {
            // Verify identity before enabling
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to enable biometrics',
            });
            if (result.success) {
                setBiometricsEnabled(true);
                await AsyncStorage.setItem('biometrics_enabled', 'true');
            } else {
                Alert.alert('Authentication Failed', 'Could not verify identity.');
            }
        } else {
            setBiometricsEnabled(false);
            await AsyncStorage.setItem('biometrics_enabled', 'false');
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
                    <ArrowLeft size={24} color="#374151" className="dark:text-white" />
                </Pressable>
                <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">Security</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <FadeInView>
                    <View className="bg-primary/10 p-5 rounded-2xl flex-row items-center gap-4 mb-8">
                        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                            <Shield size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-text-primary dark:text-text-dark font-display">App Security</Text>
                            <Text className="text-xs text-text-secondary mt-1">Protect your financial data.</Text>
                        </View>
                    </View>

                    <Text className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">Access Control</Text>

                    <View className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

                        <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 items-center justify-center">
                                    <Fingerprint size={20} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="font-semibold text-text-primary dark:text-text-dark font-body">Biometric Unlock</Text>
                                    <Text className="text-xs text-text-secondary">Use FaceID / Fingerprint to log in</Text>
                                </View>
                            </View>
                            <Switch
                                disabled={!isSupported}
                                value={biometricsEnabled}
                                onValueChange={toggleBiometrics}
                                trackColor={{ false: '#E5E7EB', true: '#2ECC71' }}
                            />
                        </View>

                        <Pressable className="flex-row items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-800/50">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 items-center justify-center">
                                    <Lock size={20} color="#9CA3AF" />
                                </View>
                                <View>
                                    <Text className="font-semibold text-text-primary dark:text-text-dark font-body">Change Password</Text>
                                    <Text className="text-xs text-text-secondary">Update your login password</Text>
                                </View>
                            </View>
                        </Pressable>

                    </View>

                    {!isSupported && (
                        <Text className="text-center text-xs text-red-400 mt-4">
                            Biometric authentication is not available on this device.
                        </Text>
                    )}

                </FadeInView>
            </ScrollView>
        </SafeAreaView>
    );
}
