import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import TransactionItem from '../transactions/TransactionItem';
import { ShoppingBag, Coffee, ArrowUpRight, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function TransactionPreview() {
  const router = useRouter();

  // Mock data
  const transactions = [
    { id: 1, title: 'Grocery Store', amount: '$45.20', date: 'Today', type: 'expense', category: 'Groceries', icon: ShoppingBag },
    { id: 2, title: 'Morning Coffee', amount: '$4.50', date: 'Today', type: 'expense', category: 'Food & Drink', icon: Coffee },
    { id: 3, title: 'Freelance Payment', amount: '$250.00', date: 'Yesterday', type: 'income', category: 'Income', icon: ArrowUpRight },
  ] as const;

  return (
    <View className="bg-card-light dark:bg-card-dark p-5 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mt-2">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-text-primary dark:text-text-dark font-display font-bold text-lg">Recent Transactions</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/transactions')} 
          className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full active:scale-95"
          activeOpacity={0.7}
        >
          <Text className="text-primary font-body text-sm font-semibold mr-1">See All</Text>
          <ArrowRight size={14} color="#2ECC71" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      
      <View>
        {transactions.map((tx) => (
          <TransactionItem 
            key={tx.id}
            title={tx.title}
            amount={tx.amount}
            date={tx.date}
            type={tx.type}
            category={tx.category}
            icon={tx.icon}
          />
        ))}
      </View>
    </View>
  );
}
