import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Mail, Lock, User, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function SignUpScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (loading) return;

        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, fullName.trim());
            Alert.alert('Success', 'Account created! Please check your email for verification.');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-background-dark">
            <StatusBar style="light" />

            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    <View className="items-center mb-10">
                        <View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center mb-4 border border-primary/30">
                            <User size={32} color="#2ECC71" />
                        </View>
                        <Text className="text-3xl text-text-dark font-display text-center mb-2">Create Account</Text>
                        <Text className="text-text-secondary font-body text-center">Join MoneyMind to master your finances</Text>
                    </View>

                    <View className="space-y-4">
                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Full Name</Text>
                            <View className="flex-row items-center bg-card-dark border border-white/5 rounded-2xl px-4 h-14">
                                <User size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="John Doe"
                                    placeholderTextColor="#4B5563"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Email Address</Text>
                            <View className="flex-row items-center bg-card-dark border border-white/5 rounded-2xl px-4 h-14">
                                <Mail size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="john@example.com"
                                    placeholderTextColor="#4B5563"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Password</Text>
                            <View className="flex-row items-center bg-card-dark border border-white/5 rounded-2xl px-4 h-14">
                                <Lock size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="••••••••"
                                    placeholderTextColor="#4B5563"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                        </View>

                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Confirm Password</Text>
                            <View className="flex-row items-center bg-card-dark border border-white/5 rounded-2xl px-4 h-14">
                                <ShieldCheck size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="••••••••"
                                    placeholderTextColor="#4B5563"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSignUp}
                            disabled={loading}
                            className={`bg-primary h-14 rounded-2xl flex-row items-center justify-center mt-6 ${loading ? 'opacity-70' : 'active:opacity-90'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#0F1419" />
                            ) : (
                                <>
                                    <Text className="text-background-dark font-display text-lg mr-2">Create Account</Text>
                                    <ArrowRight size={20} color="#0F1419" strokeWidth={2.5} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center mt-8 mb-4">
                        <Text className="text-text-secondary font-body">Already have an account? </Text>
                        <Link href="/auth/login" asChild>
                            <TouchableOpacity>
                                <Text className="text-primary font-display">Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
