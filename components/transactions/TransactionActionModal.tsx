import React from 'react';
import { View, Text, Modal, Pressable, Platform } from 'react-native';
import { Edit2, Trash2, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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

const GlassPanel = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: any }) => (
    <View className={`overflow-hidden rounded-3xl border border-white/10 ${className}`} style={style}>
        <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint="dark" className="absolute inset-0" />
        <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0"
        />
        {children}
    </View>
);

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
                className="flex-1 bg-black/70 justify-end"
                onPress={onClose}
            >
                <Pressable onPress={(e) => e.stopPropagation()}>
                    <GlassPanel className="rounded-t-[32px] px-6 pb-8 pt-6">
                        {/* Header */}
                        <View className="flex-row justify-between items-start mb-6">
                            <View className="flex-1 pr-4">
                                <Text className="text-2xl font-display font-bold text-white mb-2" numberOfLines={1}>
                                    {title}
                                </Text>
                                <Text className={`text-3xl font-mono font-bold mb-2 ${isExpense ? 'text-red-500' : 'text-primary'}`}>
                                    {isExpense ? '-' : '+'}{amount}
                                </Text>
                                <Text className="text-sm font-body text-gray-400">
                                    {category} • {date}
                                </Text>
                            </View>
                            <Pressable
                                onPress={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center active:scale-90"
                            >
                                <X size={20} color="#9CA3AF" strokeWidth={2.5} />
                            </Pressable>
                        </View>

                        {/* Action Buttons */}
                        <View className="gap-3">
                            {/* Edit Button */}
                            <Pressable
                                onPress={onEdit}
                                className="flex-row items-center rounded-2xl p-4 active:scale-[0.98] overflow-hidden border border-primary/20"
                            >
                                <BlurView intensity={Platform.OS === 'ios' ? 10 : 80} tint="dark" className="absolute inset-0" />
                                <LinearGradient
                                    colors={['rgba(54, 226, 123, 0.1)', 'rgba(54, 226, 123, 0.05)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="absolute inset-0"
                                />
                                <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-4 z-10">
                                    <Edit2 size={22} color="black" strokeWidth={2.5} />
                                </View>
                                <View className="flex-1 z-10">
                                    <Text className="text-base font-display font-bold text-white mb-0.5">
                                        Edit Transaction
                                    </Text>
                                    <Text className="text-xs font-body text-gray-400">
                                        Modify amount, category, or details
                                    </Text>
                                </View>
                            </Pressable>

                            {/* Delete Button */}
                            <Pressable
                                onPress={onDelete}
                                className="flex-row items-center rounded-2xl p-4 active:scale-[0.98] overflow-hidden border border-red-500/20"
                            >
                                <BlurView intensity={Platform.OS === 'ios' ? 10 : 80} tint="dark" className="absolute inset-0" />
                                <LinearGradient
                                    colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="absolute inset-0"
                                />
                                <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center mr-4 z-10">
                                    <Trash2 size={22} color="white" strokeWidth={2.5} />
                                </View>
                                <View className="flex-1 z-10">
                                    <Text className="text-base font-display font-bold text-red-400 mb-0.5">
                                        Delete Transaction
                                    </Text>
                                    <Text className="text-xs font-body text-gray-400">
                                        Remove this transaction permanently
                                    </Text>
                                </View>
                            </Pressable>

                            {/* Cancel Button */}
                            <Pressable
                                onPress={onClose}
                                className="rounded-2xl p-4 active:scale-[0.98] mt-2 overflow-hidden border border-white/10"
                            >
                                <BlurView intensity={Platform.OS === 'ios' ? 10 : 80} tint="dark" className="absolute inset-0" />
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="absolute inset-0"
                                />
                                <Text className="text-base font-display font-bold text-white text-center z-10">
                                    Cancel
                                </Text>
                            </Pressable>
                        </View>
                    </GlassPanel>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
