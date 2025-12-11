import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import TransactionItem from '../transactions/TransactionItem';
import { ShoppingBag, Coffee, ArrowUpRight, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTransactions } from '../../context/TransactionContext';

export default function TransactionPreview() {
  const router = useRouter();
  const { transactions } = useTransactions();

  // Get recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

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
        {recentTransactions.length > 0 ? (
          recentTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              id={tx.id}
              title={tx.title}
              amount={formatCurrency(tx.amount)}
              date={new Date(tx.date).toLocaleDateString()}
              type={tx.type}
              category={tx.category}
              icon={tx.icon}
            />
          ))
        ) : (
          <Text className="text-text-secondary text-center py-4">No recent transactions</Text>
        )}
      </View>
    </View>
  );
}
