import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Edit2, Trash2, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface TransactionActionModalProps {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    title: string;
    amount: string;
    category: string;
    date: string;
    isExpense: boolean;
}

export default function TransactionActionModal({
    visible,
    onClose,
    onEdit,
    onDelete,
    title,
    amount,
    category,
    date,
    isExpense,
}: TransactionActionModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 bg-black/50 justify-end"
                onPress={onClose}
            >
                <Pressable onPress={(e) => e.stopPropagation()}>
                    <View className="bg-card-light dark:bg-card-dark rounded-t-3xl px-6 pb-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-1">
                                <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark mb-1" numberOfLines={1}>
                                    {title}
                                </Text>
                                <View className="flex-row items-center">
                                    <Text className={`text-2xl font-mono font-bold mr-3 ${isExpense ? 'text-accent' : 'text-primary'
                                        }`}>
                                        {isExpense ? '-' : '+'}{amount}
                                    </Text>
                                </View>
                                <Text className="text-sm font-body text-text-secondary mt-1">
                                    {category} • {date}
                                </Text>
                            </View>
                            <Pressable
                                onPress={onClose}
                                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center active:scale-90"
                            >
                                <X size={20} color="#6B7280" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        {/* Action Buttons */}
                        <View className="space-y-3">
                            {/* Edit Button */}
                            <TouchableOpacity
                                onPress={onEdit}
                                className="flex-row items-center bg-primary/10 border border-primary/20 rounded-2xl p-4 active:scale-98"
                                activeOpacity={0.8}
                            >
                                <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-4">
                                    <Edit2 size={22} color="white" strokeWidth={2.5} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-display font-bold text-text-primary dark:text-text-dark mb-0.5">
                                        Edit Transaction
                                    </Text>
                                    <Text className="text-xs font-body text-text-secondary">
                                        Modify amount, category, or details
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Delete Button */}
                            <TouchableOpacity
                                onPress={onDelete}
                                className="flex-row items-center bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4 active:scale-98"
                                activeOpacity={0.8}
                            >
                                <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center mr-4">
                                    <Trash2 size={22} color="white" strokeWidth={2.5} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-display font-bold text-red-500 mb-0.5">
                                        Delete Transaction
                                    </Text>
                                    <Text className="text-xs font-body text-text-secondary">
                                        Remove this transaction permanently
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={onClose}
                                className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 active:scale-98 mt-2"
                                activeOpacity={0.8}
                            >
                                <Text className="text-base font-display font-bold text-text-primary dark:text-text-dark text-center">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
