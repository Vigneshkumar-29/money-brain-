import { View, Text, TextInput, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useTransactions, Transaction } from '../../context/TransactionContext';
import {
  X,
  Utensils,
  ShoppingBag,
  Car, // flight_takeoff -> Plane if available, else Car/Map
  Zap, // bolt
  Heart, // cardiology -> Heart
  CheckCircle,
  Delete, // backspace
  ArrowUp,
  ArrowDown,
  ArrowLeft
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Mapping categories to icons matching the design request as close as possible with Lucide
const CATEGORIES_CONFIG: Record<string, { label: string, icon: any }> = {
  food: { label: 'Food', icon: Utensils },
  travel: { label: 'Travel', icon: Car }, // Using Car as generic travel or Plane if available in specific version
  bills: { label: 'Bills', icon: Zap },
  shopping: { label: 'Shopping', icon: ShoppingBag },
  health: { label: 'Health', icon: Heart },
};

const EXPENSE_CATEGORIES = Object.keys(CATEGORIES_CONFIG).map(id => ({ id, ...CATEGORIES_CONFIG[id] }));

// For now, mocking categories for other types if needed, or reusing
const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: ArrowDown },
  { id: 'freelance', label: 'Freelance', icon: ArrowUp },
];

interface TransactionFormProps {
  onClose?: () => void;
  initialTransaction?: Transaction;
}

export default function TransactionForm({ onClose, initialTransaction }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income' | 'lent' | 'borrowed'>(
    (initialTransaction?.type as any) || 'expense'
  );

  const { addTransaction, updateTransaction } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(initialTransaction?.amount.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialTransaction?.category || 'food');
  const [date, setDate] = useState(initialTransaction?.date ? new Date(initialTransaction.date) : new Date());

  const insets = useSafeAreaInsets();

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + key);
      }
    } else {
      // Prevent too many decimals
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      setAmount(prev => prev + key);
    }
  };

  const handleSave = async () => {
    if (!amount || !selectedCategory || loading) return;

    setLoading(true);
    try {
      const transactionData = {
        amount: parseFloat(amount),
        title: CATEGORIES_CONFIG[selectedCategory]?.label || selectedCategory, // Simplification for title
        type: type,
        category: selectedCategory,
        date: date.toISOString(),
      } as any;
      // Note: "lent" and "borrowed" might not exist on the backend type yet, casting to any or adjust context type.
      // Assuming context handles 'expense' | 'income' primarily. If 'lent'/'borrowed' are valid, remove 'as any'.

      if (initialTransaction) {
        await updateTransaction(initialTransaction.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      onClose?.();
    } catch (error) {
      console.error(error);
      alert('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#122118]">
      {/* Background Gradients */}
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.1)']}
        className="absolute inset-0 z-0"
      />
      <View className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      <View className="absolute bottom-[10%] right-[-10%] w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[80px]" />

      {/* Header with Back Button */}
      <View
        style={{ paddingTop: Math.max(insets.top, 20) }}
        className="px-6 pb-2 flex-row items-center z-10"
      >
        <Pressable
          onPress={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 items-center justify-center active:bg-gray-200 dark:active:bg-white/10"
        >
          <ArrowLeft size={24} color={Platform.OS === 'ios' ? '#000' : 'gray'} className="dark:text-white text-black" />
        </Pressable>
        <Text className="text-xl font-bold ml-4 font-display text-gray-900 dark:text-white">
          {initialTransaction ? 'Edit Transaction' : 'New Transaction'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 z-10" showsVerticalScrollIndicator={false}>

        {/* Amount Display */}
        <View className="items-center justify-center py-8">
          <View className="flex-row items-center justify-center relative">
            <Text className="text-gray-800 dark:text-white text-[3.5rem] leading-none font-bold tracking-tight font-display">
              ${amount || '0'}
            </Text>
            <View className="h-10 w-1 bg-primary ml-1 rounded-full" />
          </View>
        </View>

        {/* Transaction Type Switcher */}
        <View className="mb-8">
          <View className="flex-row p-1.5 bg-gray-100 dark:bg-[#0d1811] rounded-full border border-gray-200 dark:border-white/5 shadow-inner">
            {['expense', 'income', 'lent', 'borrowed'].map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t as any)}
                className={`flex-1 py-2.5 rounded-full items-center justify-center ${type === t ? 'bg-white dark:bg-primary shadow-sm' : ''}`}
              >
                <Text className={`text-sm font-semibold capitalize ${type === t ? 'text-black dark:text-background-dark' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-end px-1 mb-4">
            <Text className="text-xs font-bold tracking-widest text-gray-400 dark:text-primary/60 uppercase font-display">Category</Text>
            <Text className="text-xs text-primary font-medium">View All</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-6 px-6 pb-2">
            {EXPENSE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className="mr-3"
                >
                  <View className={`flex-row h-10 items-center justify-center gap-2 rounded-full pl-3 pr-5 border ${isSelected ? 'bg-primary border-transparent' : 'bg-gray-100 dark:bg-white/5 border-transparent dark:border-white/10'}`}>
                    <Icon size={20} color={isSelected ? '#112117' : '#9CA3AF'} />
                    <Text className={`text-sm font-medium ${isSelected ? 'text-[#112117]' : 'text-gray-700 dark:text-gray-200'}`}>{cat.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Numeric Keypad */}
        <View className="flex-wrap flex-row justify-between gap-y-2 mb-4 px-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'backspace'].map((key) => {
            const isIcon = key === 'backspace';
            return (
              <Pressable
                key={key}
                onPress={() => handleKeyPress(key.toString())}
                className="w-[30%] h-16 rounded-full items-center justify-center active:bg-gray-100 dark:active:bg-white/10"
              >
                {isIcon ? (
                  <Delete size={28} color={Platform.OS === 'ios' ? 'white' : 'gray'} className="dark:text-white text-gray-900" />
                ) : (
                  <Text className="text-3xl font-normal text-gray-900 dark:text-white font-display">
                    {key}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Save Action */}
        <View className="pb-8 pt-2">
          <Pressable
            onPress={handleSave}
            disabled={loading || !amount}
            className="w-full h-16 bg-primary rounded-full flex-row items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
            style={{
              shadowColor: '#36e27b',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#112117" />
            ) : (
              <>
                <CheckCircle size={24} color="#112117" />
                <Text className="text-[#112117] font-bold text-lg font-display tracking-wide">Save Transaction</Text>
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
