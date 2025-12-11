import React from 'react';
import TransactionForm from '../components/transactions/TransactionForm';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactions } from '../context/TransactionContext';

export default function TransactionModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { transactions } = useTransactions();

  const transaction = typeof id === 'string' ? transactions.find(t => t.id === id) : undefined;

  return <TransactionForm onClose={() => router.back()} initialTransaction={transaction} />;
}
