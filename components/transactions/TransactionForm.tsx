import { View, Text, TextInput, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useTransactions, Transaction } from '../../context/TransactionContext';
import { X, Calendar, DollarSign, Coffee, ShoppingBag, Home, Car, Utensils, Zap, FileText, TrendingUp, Briefcase, Gift, Heart, Smartphone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import FadeInView from '../ui/FadeInView';

interface TransactionFormProps {
  onClose?: () => void;
  initialTransaction?: Transaction;
}

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: '#FF6B6B' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#4ECDC4' },
  { id: 'transport', label: 'Transport', icon: Car, color: '#95E1D3' },
  { id: 'home', label: 'Home & Rent', icon: Home, color: '#F38181' },
  { id: 'utilities', label: 'Utilities', icon: Zap, color: '#AA96DA' },
  { id: 'entertainment', label: 'Entertainment', icon: Smartphone, color: '#FFA07A' },
  { id: 'healthcare', label: 'Healthcare', icon: Heart, color: '#FF69B4' },
  { id: 'other', label: 'Other', icon: Coffee, color: '#FCBAD3' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: DollarSign, color: '#2ECC71' },
  { id: 'freelance', label: 'Freelance', icon: Briefcase, color: '#3498DB' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, color: '#9B59B6' },
  { id: 'gift', label: 'Gift', icon: Gift, color: '#E74C3C' },
  { id: 'other', label: 'Other Income', icon: DollarSign, color: '#1ABC9C' },
];

export default function TransactionForm({ onClose, initialTransaction }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>(initialTransaction?.type || 'expense');
  const { addTransaction, updateTransaction } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(initialTransaction?.amount.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialTransaction?.category || '');
  const [date, setDate] = useState(initialTransaction?.date ? new Date(initialTransaction.date) : new Date());
  const [note, setNote] = useState(initialTransaction?.title || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    if (!amount || !selectedCategory || loading) {
      return;
    }

    setLoading(true);
    try {
      const categoryData = categories.find(c => c.id === selectedCategory);

      const transactionData = {
        amount: parseFloat(amount),
        title: note || categoryData?.label || 'Transaction',
        type,
        category: selectedCategory,
        date: date.toISOString(),
      };

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

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="px-5 pb-4 pt-2 border-b border-gray-100 dark:border-gray-800"
      >
        <FadeInView delay={0}>
          <View className="flex-row justify-between items-center mb-6">
            <Pressable
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center active:opacity-70"
            >
              <X size={22} color="#6B7280" strokeWidth={2.5} />
            </Pressable>
            <Text className="text-2xl font-display font-bold text-text-primary dark:text-text-dark">
              {initialTransaction ? 'Edit Transaction' : 'New Transaction'}
            </Text>
            <View className="w-10" />
          </View>

          {/* Type Selector */}
          <View className="flex-row bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
            <Pressable
              onPress={() => {
                setType('expense');
                setSelectedCategory('');
              }}
              className={`flex-1 py-3 rounded-xl items-center active:scale-95 ${type === 'expense' ? 'bg-accent shadow-sm' : 'bg-transparent'
                }`}
            >
              <Text className={`font-body font-bold text-base ${type === 'expense' ? 'text-white' : 'text-text-secondary dark:text-gray-400'
                }`}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setType('income');
                setSelectedCategory('');
              }}
              className={`flex-1 py-3 rounded-xl items-center active:scale-95 ${type === 'income' ? 'bg-primary shadow-sm' : 'bg-transparent'
                }`}
            >
              <Text className={`font-body font-bold text-base ${type === 'income' ? 'text-white' : 'text-text-secondary dark:text-gray-400'
                }`}>
                Income
              </Text>
            </Pressable>
          </View>
        </FadeInView>
      </View>

      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <FadeInView delay={50} className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">
            Amount
          </Text>
          <View className="bg-card-light dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 shadow-md">
            <View className="flex-row items-center">
              <Text className={`text-3xl font-mono font-bold ${amount ? 'text-primary' : 'text-gray-400'
                }`}>
                $
              </Text>
              <TextInput
                className="flex-1 ml-2 text-3xl font-mono font-bold text-text-primary dark:text-text-dark"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>
          </View>
          {!amount && (
            <Text className="text-red-500 text-xs font-body font-medium mt-2 ml-2">
              Please enter an amount
            </Text>
          )}
        </FadeInView>

        {/* Category Selector */}
        <FadeInView delay={100} className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`flex-1 min-w-[30%] bg-card-light dark:bg-card-dark border rounded-2xl p-4 active:scale-95 shadow-md ${isSelected
                      ? 'border-primary'
                      : 'border-gray-100 dark:border-gray-800'
                    }`}
                  style={{ minWidth: '30%' }}
                >
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mb-2 self-center"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <Icon size={24} color={cat.color} strokeWidth={2.5} />
                  </View>
                  <Text
                    className={`font-body font-semibold text-xs text-center ${isSelected ? 'text-primary' : 'text-text-primary dark:text-text-dark'
                      }`}
                    numberOfLines={2}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!selectedCategory && (
            <Text className="text-red-500 text-xs font-body font-medium mt-2 ml-2">
              Please select a category
            </Text>
          )}
        </FadeInView>

        {/* Date Selector */}
        <FadeInView delay={150} className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">
            Date
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="bg-card-light dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-md active:opacity-70 flex-row items-center"
          >
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-4">
              <Calendar size={20} color="#2ECC71" strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-body font-medium text-text-secondary mb-1">
                Transaction Date
              </Text>
              <Text className="text-base font-body font-bold text-text-primary dark:text-text-dark">
                {formatDate(date)}
              </Text>
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (event.type === 'set' && selectedDate) {
                  setShowDatePicker(false);
                  setDate(selectedDate);
                } else if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                }
              }}
              maximumDate={new Date()}
            />
          )}
        </FadeInView>

        {/* Note Input */}
        <FadeInView delay={200} className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">
            Note (Optional)
          </Text>
          <View className="bg-card-light dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-md min-h-[100px]">
            <View className="flex-row items-center mb-2">
              <FileText size={18} color="#9CA3AF" strokeWidth={2.5} />
              <Text className="text-xs font-body font-medium text-text-secondary ml-2">
                Add description
              </Text>
            </View>
            <TextInput
              className="flex-1 text-base font-body font-medium text-text-primary dark:text-text-dark"
              placeholder="e.g., Lunch with team, Monthly rent..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
              numberOfLines={3}
            />
          </View>
        </FadeInView>

        <View className="h-24" />
      </ScrollView>

      {/* Fixed Bottom Save Button */}
      <View
        style={{ paddingBottom: insets.bottom || 20 }}
        className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-card-light dark:bg-card-dark"
      >
        <Pressable
          onPress={handleSave}
          disabled={!amount || !selectedCategory || loading}
          className={`py-4 rounded-2xl items-center justify-center active:scale-95 shadow-md ${amount && selectedCategory
              ? 'bg-primary'
              : 'bg-gray-200 dark:bg-gray-800'
            }`}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className={`font-body font-bold text-lg ${amount && selectedCategory ? 'text-white' : 'text-gray-500'
              }`}>
              {initialTransaction ? 'Update Transaction' : 'Save Transaction'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
