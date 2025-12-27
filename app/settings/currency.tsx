import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import React, { useState, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Search, Globe } from 'lucide-react-native';
import FadeInView from '../../components/ui/FadeInView';
import { usePreferences } from '../../context/PreferencesContext';
import { CurrencyConfig } from '../../lib/preferences';

export default function CurrencySettings() {
    const router = useRouter();
    const { currency, setCurrency, availableCurrencies, formatCurrency } = usePreferences();
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);

    // Filter currencies based on search
    const filteredCurrencies = useMemo(() => {
        if (!search.trim()) return availableCurrencies;

        const query = search.toLowerCase();
        return availableCurrencies.filter(c =>
            c.code.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query) ||
            c.symbol.includes(query)
        );
    }, [search, availableCurrencies]);

    const handleSelectCurrency = async (newCurrency: CurrencyConfig) => {
        if (newCurrency.code === currency.code) return;

        setSaving(true);
        try {
            await setCurrency(newCurrency);
            // Small delay for visual feedback
            setTimeout(() => {
                router.back();
            }, 300);
        } catch (e) {
            console.error('Error saving currency:', e);
        } finally {
            setSaving(false);
        }
    };

    // Group currencies by region for better UX
    const popularCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY'];
    const popularList = filteredCurrencies.filter(c => popularCurrencies.includes(c.code));
    const otherList = filteredCurrencies.filter(c => !popularCurrencies.includes(c.code));

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
                <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">Currency</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                <FadeInView>
                    {/* Current Currency Display */}
                    <View className="bg-primary/10 p-5 rounded-2xl flex-row items-center gap-4 mb-6">
                        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                            <Text className="text-xl font-bold text-black">{currency.symbol}</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-text-primary dark:text-text-dark font-display">
                                {currency.name}
                            </Text>
                            <Text className="text-xs text-text-secondary mt-1">
                                {currency.code} • Example: {formatCurrency(12345.67)}
                            </Text>
                        </View>
                    </View>

                    {/* Search */}
                    <View className="mb-6">
                        <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                            <Search size={20} color="#9CA3AF" />
                            <TextInput
                                placeholder="Search currencies..."
                                placeholderTextColor="#6B7280"
                                value={search}
                                onChangeText={setSearch}
                                className="flex-1 ml-3 text-white font-body"
                            />
                        </View>
                    </View>

                    {/* Popular Currencies */}
                    {popularList.length > 0 && !search && (
                        <View className="mb-6">
                            <Text className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">
                                Popular
                            </Text>
                            <View className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                {popularList.map((item, index) => (
                                    <CurrencyRow
                                        key={item.code}
                                        currency={item}
                                        isSelected={item.code === currency.code}
                                        onSelect={() => handleSelectCurrency(item)}
                                        isLast={index === popularList.length - 1}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* All Currencies */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">
                            {search ? `Results (${filteredCurrencies.length})` : 'All Currencies'}
                        </Text>
                        {(search ? filteredCurrencies : otherList).length > 0 ? (
                            <View className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                {(search ? filteredCurrencies : otherList).map((item, index, arr) => (
                                    <CurrencyRow
                                        key={item.code}
                                        currency={item}
                                        isSelected={item.code === currency.code}
                                        onSelect={() => handleSelectCurrency(item)}
                                        isLast={index === arr.length - 1}
                                    />
                                ))}
                            </View>
                        ) : (
                            <Text className="text-center text-gray-500 py-8">
                                No currencies found matching "{search}"
                            </Text>
                        )}
                    </View>
                </FadeInView>
            </ScrollView>
        </SafeAreaView>
    );
}

// Currency row component
function CurrencyRow({
    currency,
    isSelected,
    onSelect,
    isLast
}: {
    currency: CurrencyConfig;
    isSelected: boolean;
    onSelect: () => void;
    isLast: boolean;
}) {
    return (
        <Pressable
            onPress={onSelect}
            className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
        >
            <View className="flex-row items-center gap-3 flex-1">
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${isSelected ? 'bg-primary' : 'bg-gray-100 dark:bg-white/10'}`}>
                    <Text className={`text-base font-bold ${isSelected ? 'text-black' : 'text-gray-600 dark:text-gray-300'}`}>
                        {currency.symbol}
                    </Text>
                </View>
                <View className="flex-1">
                    <Text className="font-semibold text-text-primary dark:text-text-dark font-body">
                        {currency.name}
                    </Text>
                    <Text className="text-xs text-text-secondary mt-0.5">
                        {currency.code}
                    </Text>
                </View>
            </View>
            {isSelected && (
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <Check size={16} color="#000" strokeWidth={3} />
                </View>
            )}
        </Pressable>
    );
}
