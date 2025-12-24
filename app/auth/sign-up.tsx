import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Mail, Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function SignUpScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const mounted = useRef(true);
    const scrollViewRef = useRef<ScrollView>(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        mounted.current = true;

        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            mounted.current = false;
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleSignUp = async () => {
        if (loading) return;
        setErrorMsg(null);

        if (!fullName.trim() || !email || !password || !confirmPassword) {
            setErrorMsg('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setLoading(true);

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Please check your connection.')), 15000)
        );

        try {
            await Promise.race([signUp(email, password, fullName.trim()), timeout]);
            if (mounted.current) {
                Alert.alert('Success', 'Account created! Please check your email for verification.');
                // We keep loading true or we can navigate. Usually verification is needed.
                // The context might not auto-login if email needs verification.
                // But Supabase often allows login or we can redirect to login.
                router.replace('/auth/login');
            }
        } catch (error: any) {
            if (mounted.current) {
                setErrorMsg(error.message || 'An unexpected error occurred.');
                setLoading(false);
            }
        }
    };

    return (
        <View className="flex-1 bg-background-dark">
            <StatusBar style="light" />

            <SafeAreaView className="flex-1">
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: keyboardVisible ? 'flex-start' : 'center',
                        padding: 24,
                        paddingBottom: keyboardVisible ? 150 : 24
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="items-center mb-10">
                        <View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center mb-4 border border-primary/30">
                            <User size={32} color="#2ECC71" />
                        </View>
                        <Text className="text-3xl text-text-dark font-display text-center mb-2">Create Account</Text>
                        <Text className="text-text-secondary font-body text-center">Join MoneyMind to master your finances</Text>
                    </View>

                    <View className="space-y-4">
                        {errorMsg && (
                            <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex-row items-center mb-2">
                                <AlertCircle size={20} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text className="text-red-400 font-body flex-1 text-sm">{errorMsg}</Text>
                            </View>
                        )}

                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Full Name</Text>
                            <View className={`flex-row items-center bg-card-dark border rounded-2xl px-4 h-14 ${errorMsg && !fullName ? 'border-red-500/30' : 'border-white/5'}`}>
                                <User size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="John Doe"
                                    placeholderTextColor="#4B5563"
                                    value={fullName}
                                    onChangeText={(text) => {
                                        setFullName(text);
                                        if (errorMsg) setErrorMsg(null);
                                    }}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Email Address</Text>
                            <View className={`flex-row items-center bg-card-dark border rounded-2xl px-4 h-14 ${errorMsg && !email ? 'border-red-500/30' : 'border-white/5'}`}>
                                <Mail size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="john@example.com"
                                    placeholderTextColor="#4B5563"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errorMsg) setErrorMsg(null);
                                    }}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Password</Text>
                            <View className={`flex-row items-center bg-card-dark border rounded-2xl px-4 h-14 ${errorMsg && !password ? 'border-red-500/30' : 'border-white/5'}`}>
                                <Lock size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="••••••••"
                                    placeholderTextColor="#4B5563"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errorMsg) setErrorMsg(null);
                                    }}
                                    editable={!loading}
                                    returnKeyType="next"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                    className="ml-2 p-1"
                                    activeOpacity={0.7}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#6B7280" />
                                    ) : (
                                        <Eye size={20} color="#6B7280" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="space-y-2">
                            <Text className="text-text-secondary text-base font-body ml-1">Confirm Password</Text>
                            <View className={`flex-row items-center bg-card-dark border rounded-2xl px-4 h-14 ${errorMsg && password !== confirmPassword ? 'border-red-500/30' : 'border-white/5'}`}>
                                <ShieldCheck size={20} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-text-dark font-body text-base"
                                    placeholder="••••••••"
                                    placeholderTextColor="#4B5563"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errorMsg) setErrorMsg(null);
                                    }}
                                    editable={!loading}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSignUp}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading}
                                    className="ml-2 p-1"
                                    activeOpacity={0.7}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} color="#6B7280" />
                                    ) : (
                                        <Eye size={20} color="#6B7280" />
                                    )}
                                </TouchableOpacity>
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
                            <TouchableOpacity disabled={loading}>
                                <Text className="text-primary font-display">Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
