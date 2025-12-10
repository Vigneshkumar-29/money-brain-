import React from 'react';
import TransactionForm from '../components/transactions/TransactionForm';
import { useRouter } from 'expo-router';

export default function TransactionModal() {
  const router = useRouter();
  return <TransactionForm onClose={() => router.back()} />;
}
