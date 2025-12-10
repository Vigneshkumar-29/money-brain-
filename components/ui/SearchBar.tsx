import { View, TextInput } from 'react-native';
import React from 'react';
import { Search } from 'lucide-react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = "Search..." }: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-2xl px-4 h-14 shadow-sm">
      <Search size={20} color="#9CA3AF" strokeWidth={2.5} />
      <TextInput
        className="flex-1 ml-3 text-base text-text-primary dark:text-text-dark font-medium"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
