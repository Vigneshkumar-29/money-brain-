import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ICON_MAP, getCategoryIconName } from '../../lib/constants';

type TransactionItemProps = {
    id: string;
    title: string;
    amount: string;
    date: string;
    type: 'income' | 'expense' | 'lent' | 'borrowed';
    category: string;
    icon?: string;
};

export default function TransactionItem({ id, title, amount, date, type, category, icon }: TransactionItemProps) {
    const router = useRouter();

    const getIcon = () => {
        const iconName = icon || getCategoryIconName(category);
        const IconComponent = ICON_MAP[iconName] || ICON_MAP['DollarSign'];
        return <IconComponent size={20} color={type === 'income' ? '#2ECC71' : type === 'expense' ? '#EF4444' : '#3B82F6'} />;
    };

    const getTypeIcon = () => {
        switch (type) {
            case 'income': return <ArrowUpRight size={14} color="#2ECC71" />;
            case 'expense': return <ArrowDownLeft size={14} color="#EF4444" />;
            case 'lent': return <ArrowRight size={14} color="#EAB308" />; // Yellow for lent
            case 'borrowed': return <ArrowLeft size={14} color="#3B82F6" />; // Blue for borrowed
            default: return <ArrowDownLeft size={14} color="#EF4444" />;
        }
    };

    const isPositive = type === 'income' || type === 'borrowed'; // Borrowed adds to wallet (technically) usually treated as liability but cash in.
    // Actually typically Expense and Lent are money leaving. Income and Borrowed are money entering.
    // Visual style:
    // Income: Green
    // Expense: Red
    // Lent: Yellow (Money out, expected back)
    // Borrowed: Blue (Money in, pay back)

    const amountColor =
        type === 'income' ? 'text-green-500' :
            type === 'expense' ? 'text-red-500' :
                type === 'lent' ? 'text-yellow-500' :
                    'text-blue-500';

    const getPrefix = () => {
        if (type === 'income' || type === 'borrowed') return '+';
        return '-';
    };

    const handlePress = () => {
        // Navigate to edit/view details modal or page
        // For now, let's open the modal with the ID
        router.push({
            pathname: '/transaction-modal',
            params: { id: id }
        });
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            className="flex-row items-center justify-between py-3.5 border-b border-gray-100 dark:border-gray-800/50 active:bg-gray-50 dark:active:bg-gray-800/30 rounded-lg px-2"
            activeOpacity={0.7}
        >
            <View className="flex-row items-center flex-1 mr-4">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 bg-gray-100 dark:bg-gray-800`}>
                    {getIcon()}
                </View>
                <View className="flex-1">
                    <Text className="text-text-primary dark:text-text-dark font-body font-semibold text-base" numberOfLines={1}>{title}</Text>
                    <View className="flex-row items-center mt-0.5">
                        <Text className="text-text-secondary font-body text-xs mr-2">{category}</Text>
                        <Text className="text-gray-300 dark:text-gray-700 text-[10px]">•</Text>
                        <Text className="text-text-secondary font-body text-xs ml-2">{date}</Text>
                    </View>
                </View>
            </View>

            <View className="items-end">
                <Text className={`font-display font-bold text-base ${amountColor}`}>
                    {getPrefix()}{amount}
                </Text>
                <View className="flex-row items-center mt-0.5 opacity-60">
                    {getTypeIcon()}
                </View>
            </View>
        </TouchableOpacity>
    );
}
