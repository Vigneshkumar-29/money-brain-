import { View, Text, TextInput, ScrollView, Platform, ActivityIndicator, Modal, Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useTransactions, Transaction } from '../../context/TransactionContext';
import { usePreferences } from '../../context/PreferencesContext';
import { getIconComponent } from '../../lib/preferences';
import {
  X,
  CheckCircle,
  Delete,
  ArrowLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Custom button component without className to avoid navigation context issues
const TypeButton: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View
        style={[
          styles.typeButton,
          isSelected ? styles.typeButtonSelected : styles.typeButtonUnselected,
        ]}
      >
        <Text
          style={[
            styles.typeButtonText,
            isSelected ? styles.typeButtonTextSelected : styles.typeButtonTextUnselected,
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

interface TransactionFormProps {
  onClose?: () => void;
  initialTransaction?: Transaction;
}

export default function TransactionForm({ onClose, initialTransaction }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income' | 'lent' | 'borrowed'>(
    (initialTransaction?.type as any) || 'expense'
  );

  const { addTransaction, updateTransaction } = useTransactions();
  const {
    expenseCategories,
    incomeCategories,
    lentCategories,
    borrowedCategories,
    currencySymbol
  } = usePreferences();

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(initialTransaction?.amount.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(initialTransaction?.category || 'food');
  const [date, setDate] = useState(initialTransaction?.date ? new Date(initialTransaction.date) : new Date());
  const [showAllCategories, setShowAllCategories] = useState(false);

  const insets = useSafeAreaInsets();

  // Get categories based on selected type - now from preferences context
  const currentCategories = useMemo(() => {
    switch (type) {
      case 'income':
        return incomeCategories;
      case 'lent':
        return lentCategories;
      case 'borrowed':
        return borrowedCategories;
      default:
        return expenseCategories;
    }
  }, [type, expenseCategories, incomeCategories, lentCategories, borrowedCategories]);

  // Update selected category when type changes
  const handleTypeChange = (newType: 'expense' | 'income' | 'lent' | 'borrowed') => {
    setType(newType);
    // Set default category for the new type
    const defaultCategories = {
      expense: 'food',
      income: 'salary',
      lent: 'lent_friend',
      borrowed: 'borrowed_friend'
    };
    setSelectedCategory(defaultCategories[newType]);
  };

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
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        alert('Please enter a valid amount');
        setLoading(false);
        return;
      }

      console.log('Saving transaction...', {
        isEdit: !!initialTransaction,
        id: initialTransaction?.id,
        amount: parsedAmount,
        category: selectedCategory,
        type
      });

      // Find the category label
      const categoryObj = currentCategories.find(cat => cat.id === selectedCategory);
      const categoryLabel = categoryObj?.label || selectedCategory;

      const transactionData = {
        amount: parsedAmount,
        title: initialTransaction?.title || categoryLabel,
        type: type,
        category: selectedCategory,
        date: date.toISOString(),
      } as any;

      // Import safely to avoid circular dependencies if any, though standard import is fine
      const { withTimeout } = require('../../utils');

      if (initialTransaction) {
        console.log('Updating transaction:', initialTransaction.id);
        await withTimeout(
          updateTransaction(initialTransaction.id, transactionData),
          8000,
          'Update timed out. Please check your internet connection.'
        );
        console.log('Update successful');
      } else {
        console.log('Adding new transaction');
        await withTimeout(
          addTransaction(transactionData),
          8000,
          'Save timed out. Please check your connection or database schema.'
        );
        console.log('Add successful');
      }

      onClose?.();
    } catch (error: any) {
      console.error('Save failed:', error);
      const errorMessage = error?.message || 'Failed to save transaction';
      alert(errorMessage);
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
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 items-center justify-center"
        >
          <ArrowLeft size={24} color="#9CA3AF" />
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
              {currencySymbol}{amount || '0'}
            </Text>
            <View className="h-10 w-1 bg-primary ml-1 rounded-full" />
          </View>
        </View>

        {/* Transaction Type Switcher */}
        <View className="mb-8">
          <View className="flex-row p-1.5 bg-gray-100 dark:bg-[#0d1811] rounded-full border border-gray-200 dark:border-white/5 shadow-inner">
            <TypeButton
              label="Expense"
              isSelected={type === 'expense'}
              onPress={() => handleTypeChange('expense')}
            />
            <TypeButton
              label="Income"
              isSelected={type === 'income'}
              onPress={() => handleTypeChange('income')}
            />
            <TypeButton
              label="Lent"
              isSelected={type === 'lent'}
              onPress={() => handleTypeChange('lent')}
            />
            <TypeButton
              label="Borrowed"
              isSelected={type === 'borrowed'}
              onPress={() => handleTypeChange('borrowed')}
            />
          </View>
        </View>

        {/* Category Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-end px-1 mb-4">
            <Text className="text-xs font-bold tracking-widest text-gray-400 dark:text-primary/60 uppercase font-display">Category</Text>
            <Pressable onPress={() => setShowAllCategories(true)}>
              <Text className="text-xs text-primary font-medium">View All ({currentCategories.length})</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-6 px-6 pb-2">
            {currentCategories.slice(0, 6).map((cat) => {
              const Icon = getIconComponent(cat.icon);
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
                className="w-[30%] h-16 rounded-full items-center justify-center"
              >
                {isIcon ? (
                  <Delete size={28} color="#9CA3AF" />
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
            className="w-full h-16 bg-primary rounded-full flex-row items-center justify-center gap-3 shadow-lg"
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

      {/* View All Categories Modal */}
      <Modal
        visible={showAllCategories}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllCategories(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <Pressable className="flex-1" onPress={() => setShowAllCategories(false)} />
          <View className="bg-white dark:bg-[#122118] rounded-t-[32px] max-h-[80%]">
            <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint="dark" className="absolute inset-0 rounded-t-[32px]" />
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="absolute inset-0 rounded-t-[32px]"
            />

            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-white/10">
              <Text className="text-xl font-bold text-white font-display">Select Category</Text>
              <Pressable
                onPress={() => setShowAllCategories(false)}
                className="w-10 h-10 rounded-full bg-white/5 items-center justify-center"
              >
                <X size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* All Categories Grid */}
            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-3 pb-6">
                {currentCategories.map((cat) => {
                  const Icon = getIconComponent(cat.icon);
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setSelectedCategory(cat.id);
                        setShowAllCategories(false);
                      }}
                      className="w-[48%]"
                    >
                      <View className={`p-4 rounded-2xl border ${isSelected ? 'bg-primary border-primary' : 'bg-white/5 border-white/10'}`}>
                        <Icon size={24} color={isSelected ? '#112117' : cat.color || '#36e27b'} />
                        <Text className={`text-sm font-medium mt-2 ${isSelected ? 'text-[#112117]' : 'text-white'}`}>
                          {cat.label}
                        </Text>
                        {cat.isCustom && (
                          <View className="absolute top-2 right-2 bg-primary/30 px-1.5 py-0.5 rounded">
                            <Text className="text-[8px] text-primary font-bold">CUSTOM</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#36e27b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonUnselected: {
    backgroundColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  typeButtonTextSelected: {
    color: '#112117',
  },
  typeButtonTextUnselected: {
    color: '#9CA3AF',
  },
});
