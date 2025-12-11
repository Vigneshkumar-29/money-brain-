import { View, Text, TextInput, Pressable, ScrollView, Keyboard, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTransactions, Transaction } from '../../context/TransactionContext';
import { X, Calendar, Tag, DollarSign, Coffee, ShoppingBag, Home, Car, Utensils, Zap, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TransactionFormProps {
  onClose?: () => void;
  initialTransaction?: Transaction;
}

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: Utensils, color: '#FF6B6B' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#4ECDC4' },
  { id: 'transport', label: 'Transport', icon: Car, color: '#95E1D3' },
  { id: 'home', label: 'Home', icon: Home, color: '#F38181' },
  { id: 'utilities', label: 'Utilities', icon: Zap, color: '#AA96DA' },
  { id: 'other', label: 'Other', icon: Coffee, color: '#FCBAD3' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: DollarSign, color: '#2ECC71' },
  { id: 'freelance', label: 'Freelance', icon: Coffee, color: '#3498DB' },
  { id: 'investment', label: 'Investment', icon: Tag, color: '#9B59B6' },
  { id: 'other', label: 'Other', icon: DollarSign, color: '#1ABC9C' },
];

export default function TransactionForm({ onClose, initialTransaction }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>(initialTransaction?.type || 'expense');
  const { addTransaction, updateTransaction } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(initialTransaction?.amount.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialTransaction?.category || '');
  const [date, setDate] = useState(initialTransaction?.date ? new Date(initialTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
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
        date: new Date(date).toISOString(),
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
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-800"
      >
        <View className="px-5 pb-4 pt-2">
          <View className="flex-row justify-between items-center mb-4">
            <Pressable onPress={onClose} className="p-2 active:scale-95 active:opacity-70">
              <X size={24} color="#6B7280" strokeWidth={2.5} />
            </Pressable>
            <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">
              {initialTransaction ? 'Edit Transaction' : 'New Transaction'}
            </Text>
            <View className="w-10" />
          </View>

          {/* Type Selector */}
          <View className="flex-row bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
            <Pressable
              onPress={() => {
                setType('expense');
                setSelectedCategory('');
              }}
              className={`flex-1 py-3 rounded-xl items-center active:scale-95 transition-all duration-200 ${type === 'expense' ? 'bg-accent shadow-md' : 'bg-transparent'}`}
            >
              <Text className={`font-body font-bold text-base ${type === 'expense' ? 'text-white' : 'text-text-secondary dark:text-gray-400'}`}>Expense</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setType('income');
                setSelectedCategory('');
              }}
              className={`flex-1 py-3 rounded-xl items-center active:scale-95 transition-all duration-200 ${type === 'income' ? 'bg-primary shadow-md' : 'bg-transparent'}`}
            >
              <Text className={`font-body font-bold text-base ${type === 'income' ? 'text-white' : 'text-text-secondary dark:text-gray-400'}`}>Income</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
        {/* Amount Input - Large and Prominent */}
        <View className="mb-8">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Amount</Text>
          <View className="flex-row items-center bg-card-light dark:bg-card-dark border-2 border-primary/30 rounded-3xl px-6 h-20 shadow-lg">
            <Text className={`text-3xl font-mono font-bold ${amount ? 'text-primary' : 'text-gray-400'}`}>$</Text>
            <TextInput
              className="flex-1 ml-2 text-4xl font-mono font-bold text-text-primary dark:text-text-dark"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
          {!amount && (
            <Text className="text-red-500 text-xs font-body font-medium mt-2 ml-2">Please enter an amount</Text>
          )}
        </View>

        {/* Category Selector */}
        <View className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Category</Text>
          <View className="flex-row flex-wrap gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`flex-1 min-w-[45%] bg-card-light dark:bg-card-dark border-2 rounded-2xl p-4 active:scale-95 active:bg-gray-50 dark:active:bg-gray-800 transition-all ${isSelected ? 'border-primary shadow-md bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  style={{ minWidth: '45%' }}
                >
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <Icon size={24} color={cat.color} strokeWidth={2.5} />
                  </View>
                  <Text className={`font-body font-semibold text-sm ${isSelected ? 'text-primary' : 'text-text-primary dark:text-text-dark'
                    }`}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Date Input */}
        <View className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Date</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center bg-card-light dark:bg-card-dark border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-5 h-16 shadow-sm active:opacity-70"
          >
            <Calendar size={22} color="#9CA3AF" strokeWidth={2.5} />
            <Text className={`flex-1 ml-3 text-base font-body font-semibold ${date ? 'text-text-primary dark:text-text-dark' : 'text-gray-400'}`}>
              {date || "Select Date"}
            </Text>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={2.5} />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS until confirmed if needed, or close. Typically close on Android.
                if (event.type === 'set' && selectedDate) {
                  setShowDatePicker(false);
                  setDate(selectedDate.toISOString().split('T')[0]);
                } else if (event.type === 'dismissed') {
                  setShowDatePicker(false);
                }
              }}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Note Input */}
        <View className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Note (Optional)</Text>
          <View className="bg-card-light dark:bg-card-dark border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 min-h-[100px] shadow-sm">
            <TextInput
              className="flex-1 text-base font-body font-medium text-text-primary dark:text-text-dark"
              placeholder="Add a note..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Fixed Bottom Save Button */}
      <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-card-light dark:bg-card-dark">
        <Pressable
          onPress={handleSave}
          disabled={!amount || !selectedCategory}
          className={`py-4 rounded-2xl items-center active:scale-95 active:opacity-90 transition-all shadow-sm ${amount && selectedCategory ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200 dark:bg-gray-800'
            }`}
        >
          <Text className={`font-body font-bold text-lg ${amount && selectedCategory ? 'text-white' : 'text-gray-500'
            }`}>
            {loading ? <ActivityIndicator color="white" /> : (initialTransaction ? 'Update Transaction' : 'Save Transaction')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
