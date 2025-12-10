import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { LucideIcon } from 'lucide-react-native';

interface TransactionItemProps {
  title: string;
  amount: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  icon: LucideIcon;
  onPress?: () => void;
}

export default function TransactionItem({ title, amount, date, type, category, icon: Icon, onPress }: TransactionItemProps) {
  const isExpense = type === 'expense';
  const amountColor = isExpense ? 'text-accent' : 'text-primary';
  const iconColor = isExpense ? '#FF6B6B' : '#2ECC71';
  const iconBgColor = isExpense ? 'rgba(255, 107, 107, 0.1)' : 'rgba(46, 204, 113, 0.1)';

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center justify-between py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0 active:bg-gray-50 dark:active:bg-gray-800/50 rounded-lg px-1"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View 
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3.5"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon size={22} color={iconColor} strokeWidth={2.5} />
        </View>
        <View className="flex-1">
          <Text className="text-text-primary dark:text-text-dark font-semibold text-base mb-0.5" numberOfLines={1}>{title}</Text>
          <Text className="text-text-secondary text-xs font-medium">{category} • {date}</Text>
        </View>
      </View>
      <Text className={`font-mono font-bold text-base ${amountColor}`}>
        {isExpense ? '-' : '+'}{amount}
      </Text>
    </TouchableOpacity>
  );
}
