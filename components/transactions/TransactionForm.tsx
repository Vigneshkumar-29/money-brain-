import { View, Text, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import React, { useState } from 'react';
import { X, Calendar, Tag, DollarSign, Coffee, ShoppingBag, Home, Car, Utensils, Zap, ChevronRight } from 'lucide-react-native';

interface TransactionFormProps {
  onClose?: () => void;
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

export default function TransactionForm({ onClose }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  const handleSave = () => {
    if (!amount || !selectedCategory) {
      return;
    }
    // Save logic here
    onClose?.();
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-card-light dark:bg-card-dark">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={onClose} className="p-2 active:scale-95" activeOpacity={0.7}>
            <X size={24} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">New Transaction</Text>
          <View className="w-10" />
        </View>

        {/* Type Selector */}
        <View className="flex-row bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
          <TouchableOpacity 
            onPress={() => {
              setType('expense');
              setSelectedCategory('');
            }}
            className={`flex-1 py-3 rounded-xl items-center active:scale-95 ${type === 'expense' ? 'bg-accent shadow-md' : ''}`}
            activeOpacity={0.7}
          >
            <Text className={`font-body font-bold text-base ${type === 'expense' ? 'text-white' : 'text-gray-500'}`}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setType('income');
              setSelectedCategory('');
            }}
            className={`flex-1 py-3 rounded-xl items-center active:scale-95 ${type === 'income' ? 'bg-primary shadow-md' : ''}`}
            activeOpacity={0.7}
          >
            <Text className={`font-body font-bold text-base ${type === 'income' ? 'text-white' : 'text-gray-500'}`}>Income</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
        {/* Amount Input - Large and Prominent */}
        <View className="mb-8">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Amount</Text>
          <View className="flex-row items-center bg-card-light dark:bg-card-dark border-2 border-primary/30 rounded-3xl px-6 h-20 shadow-lg">
            <Text className="text-3xl font-mono font-bold text-primary">$</Text>
            <TextInput
              className="flex-1 ml-2 text-4xl font-mono font-bold text-text-primary dark:text-text-dark"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        {/* Category Selector */}
        <View className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Category</Text>
          <View className="flex-row flex-wrap gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`flex-1 min-w-[45%] bg-card-light dark:bg-card-dark border-2 rounded-2xl p-4 active:scale-95 ${
                    isSelected ? 'border-primary shadow-md' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  activeOpacity={0.7}
                  style={{ minWidth: '45%' }}
                >
                  <View 
                    className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <Icon size={24} color={cat.color} strokeWidth={2.5} />
                  </View>
                  <Text className={`font-body font-semibold text-sm ${
                    isSelected ? 'text-primary' : 'text-text-primary dark:text-text-dark'
                  }`}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date Input */}
        <View className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Date</Text>
          <TouchableOpacity 
            className="flex-row items-center bg-card-light dark:bg-card-dark border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-5 h-16 shadow-sm"
            activeOpacity={0.7}
          >
            <Calendar size={22} color="#9CA3AF" strokeWidth={2.5} />
            <Text className="flex-1 ml-3 text-base font-semibold text-text-primary dark:text-text-dark">
              {date}
            </Text>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Note Input */}
        <View className="mb-6">
          <Text className="text-text-secondary font-body text-xs font-bold mb-3 uppercase tracking-wide">Note (Optional)</Text>
          <View className="bg-card-light dark:bg-card-dark border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 min-h-[100px] shadow-sm">
            <TextInput
              className="flex-1 text-base font-medium text-text-primary dark:text-text-dark"
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
        <TouchableOpacity 
          onPress={handleSave}
          disabled={!amount || !selectedCategory}
          className={`py-4 rounded-2xl items-center active:scale-95 ${
            amount && selectedCategory ? 'bg-primary shadow-lg' : 'bg-gray-300 dark:bg-gray-700'
          }`}
          activeOpacity={0.9}
        >
          <Text className={`font-bold text-lg ${
            amount && selectedCategory ? 'text-white' : 'text-gray-500'
          }`}>
            Save Transaction
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
