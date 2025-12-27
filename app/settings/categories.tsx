import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert, Platform } from 'react-native';
import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, Trash2, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import FadeInView from '../../components/ui/FadeInView';
import { usePreferences } from '../../context/PreferencesContext';
import { CategoryConfig, CATEGORY_ICONS, AVAILABLE_COLORS, getIconComponent } from '../../lib/preferences';

type CategoryType = 'expense' | 'income' | 'lent' | 'borrowed';

export default function CategoriesSettings() {
    const router = useRouter();
    const {
        expenseCategories,
        incomeCategories,
        lentCategories,
        borrowedCategories,
        customCategories,
        addCustomCategory,
        deleteCustomCategory,
    } = usePreferences();

    const [selectedType, setSelectedType] = useState<CategoryType>('expense');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        icon: 'Tag',
        color: AVAILABLE_COLORS[0],
    });

    const getCategoriesForType = (type: CategoryType): CategoryConfig[] => {
        switch (type) {
            case 'expense': return expenseCategories;
            case 'income': return incomeCategories;
            case 'lent': return lentCategories;
            case 'borrowed': return borrowedCategories;
            default: return expenseCategories;
        }
    };

    const currentCategories = getCategoriesForType(selectedType);

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        // Create unique ID
        const id = `custom_${selectedType}_${Date.now()}`;

        try {
            await addCustomCategory({
                id,
                label: newCategory.name.trim(),
                icon: newCategory.icon,
                color: newCategory.color,
                type: selectedType,
            });

            setShowAddModal(false);
            setNewCategory({ name: '', icon: 'Tag', color: AVAILABLE_COLORS[0] });
        } catch (e) {
            Alert.alert('Error', 'Failed to add category');
        }
    };

    const handleDeleteCategory = (category: CategoryConfig) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${category.label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCustomCategory(category.id);
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete category');
                        }
                    },
                },
            ]
        );
    };

    const typeLabels: Record<CategoryType, string> = {
        expense: 'Expense',
        income: 'Income',
        lent: 'Lent',
        borrowed: 'Borrowed',
    };

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
                >
                    <ArrowLeft size={24} color="#9CA3AF" />
                </Pressable>
                <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">Categories</Text>
                <Pressable
                    onPress={() => setShowAddModal(true)}
                    className="w-10 h-10 items-center justify-center rounded-full bg-primary active:bg-primary/80"
                >
                    <Plus size={24} color="#000" />
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                <FadeInView>
                    {/* Type Selector */}
                    <View className="flex-row bg-white/5 rounded-xl p-1 mb-6">
                        {(['expense', 'income', 'lent', 'borrowed'] as CategoryType[]).map((type) => (
                            <Pressable
                                key={type}
                                onPress={() => setSelectedType(type)}
                                className={`flex-1 py-2.5 rounded-lg ${selectedType === type ? 'bg-primary' : ''}`}
                            >
                                <Text className={`text-center text-sm font-semibold ${selectedType === type ? 'text-black' : 'text-gray-400'}`}>
                                    {typeLabels[type]}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Custom Categories Count */}
                    {customCategories.filter(c => c.type === selectedType).length > 0 && (
                        <View className="bg-primary/10 p-4 rounded-xl mb-4 flex-row items-center gap-3">
                            <Plus size={20} color="#36e27b" />
                            <Text className="text-sm text-text-primary dark:text-text-dark flex-1">
                                You have {customCategories.filter(c => c.type === selectedType).length} custom {selectedType} {customCategories.filter(c => c.type === selectedType).length === 1 ? 'category' : 'categories'}
                            </Text>
                        </View>
                    )}

                    {/* Categories List */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">
                            {typeLabels[selectedType]} Categories ({currentCategories.length})
                        </Text>
                        <View className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {currentCategories.map((category, index) => {
                                const IconComponent = getIconComponent(category.icon);
                                const isCustom = category.isCustom;

                                return (
                                    <View
                                        key={category.id}
                                        className={`flex-row items-center justify-between p-4 ${index !== currentCategories.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                                    >
                                        <View className="flex-row items-center gap-3 flex-1">
                                            <View
                                                className="w-10 h-10 rounded-xl items-center justify-center"
                                                style={{ backgroundColor: `${category.color}20` }}
                                            >
                                                <IconComponent size={20} color={category.color} />
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row items-center gap-2">
                                                    <Text className="font-semibold text-text-primary dark:text-text-dark font-body">
                                                        {category.label}
                                                    </Text>
                                                    {isCustom && (
                                                        <View className="bg-primary/20 px-2 py-0.5 rounded-full">
                                                            <Text className="text-[10px] text-primary font-bold">CUSTOM</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                        {isCustom && (
                                            <Pressable
                                                onPress={() => handleDeleteCategory(category)}
                                                className="w-8 h-8 items-center justify-center rounded-full bg-red-500/10"
                                            >
                                                <Trash2 size={16} color="#EF4444" />
                                            </Pressable>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </FadeInView>
            </ScrollView>

            {/* Add Category Modal */}
            <Modal
                visible={showAddModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <View className="flex-1 bg-black/70 justify-end">
                    <Pressable className="flex-1" onPress={() => setShowAddModal(false)} />
                    <View className="bg-white dark:bg-[#122118] rounded-t-[32px] max-h-[90%]">
                        <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint="dark" className="absolute inset-0 rounded-t-[32px]" />
                        <LinearGradient
                            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="absolute inset-0 rounded-t-[32px]"
                        />

                        {/* Modal Header */}
                        <View className="flex-row items-center justify-between p-6 border-b border-white/10">
                            <Text className="text-xl font-bold text-white font-display">Add Custom Category</Text>
                            <Pressable
                                onPress={() => setShowAddModal(false)}
                                className="w-10 h-10 rounded-full bg-white/5 items-center justify-center"
                            >
                                <X size={20} color="#9CA3AF" />
                            </Pressable>
                        </View>

                        <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
                            {/* Category Type Info */}
                            <View className="bg-white/5 p-3 rounded-xl flex-row items-center gap-2 mb-6">
                                <Text className="text-gray-400 text-sm">Adding to:</Text>
                                <View className="bg-primary px-3 py-1 rounded-full">
                                    <Text className="text-black font-bold text-sm">{typeLabels[selectedType]}</Text>
                                </View>
                            </View>

                            {/* Category Name */}
                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Category Name</Text>
                            <TextInput
                                placeholder="e.g., Gym, Subscriptions, Side Income..."
                                placeholderTextColor="#6B7280"
                                value={newCategory.name}
                                onChangeText={(text) => setNewCategory(prev => ({ ...prev, name: text }))}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white font-body mb-6"
                            />

                            {/* Icon Selection */}
                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Icon</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-6 px-6">
                                <View className="flex-row gap-2">
                                    {Object.keys(CATEGORY_ICONS).slice(0, 20).map((iconName) => {
                                        const IconComp = CATEGORY_ICONS[iconName];
                                        const isSelected = newCategory.icon === iconName;
                                        return (
                                            <Pressable
                                                key={iconName}
                                                onPress={() => setNewCategory(prev => ({ ...prev, icon: iconName }))}
                                                className={`w-12 h-12 rounded-xl items-center justify-center ${isSelected ? 'bg-primary' : 'bg-white/5 border border-white/10'}`}
                                            >
                                                <IconComp size={22} color={isSelected ? '#000' : '#9CA3AF'} />
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </ScrollView>

                            {/* Color Selection */}
                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Color</Text>
                            <View className="flex-row flex-wrap gap-2 mb-8">
                                {AVAILABLE_COLORS.map((color) => {
                                    const isSelected = newCategory.color === color;
                                    return (
                                        <Pressable
                                            key={color}
                                            onPress={() => setNewCategory(prev => ({ ...prev, color }))}
                                            className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'border-2 border-white' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    );
                                })}
                            </View>

                            {/* Preview */}
                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">Preview</Text>
                            <View className="bg-white/5 p-4 rounded-xl flex-row items-center gap-3 mb-6">
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center"
                                    style={{ backgroundColor: `${newCategory.color}20` }}
                                >
                                    {(() => {
                                        const PreviewIcon = CATEGORY_ICONS[newCategory.icon] || CATEGORY_ICONS.Tag;
                                        return <PreviewIcon size={24} color={newCategory.color} />;
                                    })()}
                                </View>
                                <Text className="text-white font-semibold text-base">
                                    {newCategory.name || 'Category Name'}
                                </Text>
                            </View>

                            {/* Add Button */}
                            <Pressable
                                onPress={handleAddCategory}
                                className="bg-primary py-4 rounded-xl items-center mb-6"
                            >
                                <Text className="text-black font-bold text-base font-display">Add Category</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
