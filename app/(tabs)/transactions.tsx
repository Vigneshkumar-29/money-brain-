import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import SearchBar from '../../components/ui/SearchBar';
import SegmentedControl from '../../components/ui/SegmentedControl';
import TransactionItem from '../../components/transactions/TransactionItem';
import FadeInView from '../../components/ui/FadeInView';
import { ShoppingBag, Coffee, ArrowUpRight, Home, Car, Smartphone } from 'lucide-react-native';

import { useTransactions } from '../../context/TransactionContext';

// Mock data removed in favor of real data from context

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [filterIndex, setFilterIndex] = useState(0);
  const { transactions, refreshTransactions } = useTransactions();
  const filters = ['All', 'Expense', 'Income'];

  // Refetch when focused to ensure up-to-date data
  // useEffect(() => { refreshTransactions() }, []); // context handles initial load, but maybe refresh on focus?

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterIndex === 0 ||
      (filterIndex === 1 && tx.type === 'expense') ||
      (filterIndex === 2 && tx.type === 'income');
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-5 pt-6">
        <FadeInView delay={0}>
          <Text className="text-3xl font-display font-bold text-text-primary dark:text-text-dark mb-8">Transactions</Text>
        </FadeInView>

        <FadeInView delay={50} className="mb-4">
          <SearchBar value={search} onChangeText={setSearch} />
        </FadeInView>

        <FadeInView delay={100} className="mb-6">
          <SegmentedControl
            values={filters}
            selectedIndex={filterIndex}
            onChange={setFilterIndex}
          />
        </FadeInView>

        <FadeInView delay={150} className="flex-1">
          <FlatList
            data={filteredTransactions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TransactionItem
                id={item.id}
                title={item.title}
                amount={formatCurrency(item.amount)}
                date={new Date(item.date).toLocaleDateString()}
                type={item.type}
                category={item.category}
                icon={item.icon}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshing={false}
            onRefresh={refreshTransactions}
          />
        </FadeInView>
      </View>
    </SafeAreaView>
  );
}
