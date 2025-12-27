import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CurrencyConfig,
    CategoryConfig,
    CURRENCIES,
    DEFAULT_CURRENCY,
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    DEFAULT_LENT_CATEGORIES,
    DEFAULT_BORROWED_CATEGORIES,
    getCurrency,
    setCurrency as saveCurrency,
    getCustomCategories,
    saveCustomCategories,
    addCustomCategory as addCustomCategoryToStorage,
    deleteCustomCategory as deleteCustomCategoryFromStorage,
} from '../lib/preferences';
import { initializeCurrency, updateCachedCurrency, formatCurrency as formatUtil, getCurrentCurrency } from '../utils/formatting';

interface PreferencesContextType {
    // Currency
    currency: CurrencyConfig;
    setCurrency: (currency: CurrencyConfig) => Promise<void>;
    availableCurrencies: CurrencyConfig[];
    formatCurrency: (amount: number, options?: { showSign?: boolean; compact?: boolean }) => string;
    currencySymbol: string;

    // Categories
    expenseCategories: CategoryConfig[];
    incomeCategories: CategoryConfig[];
    lentCategories: CategoryConfig[];
    borrowedCategories: CategoryConfig[];
    customCategories: CategoryConfig[];
    addCustomCategory: (category: Omit<CategoryConfig, 'isCustom'>) => Promise<void>;
    deleteCustomCategory: (categoryId: string) => Promise<void>;
    getCategoryById: (categoryId: string) => CategoryConfig | undefined;
    getCategoriesByType: (type: 'expense' | 'income' | 'lent' | 'borrowed') => CategoryConfig[];

    // Loading state
    isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyConfig>(DEFAULT_CURRENCY);
    const [customCategories, setCustomCategories] = useState<CategoryConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load preferences on mount
    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            // Load currency
            const loadedCurrency = await initializeCurrency();
            setCurrencyState(loadedCurrency);

            // Load custom categories
            const loadedCustomCategories = await getCustomCategories();
            setCustomCategories(loadedCustomCategories);
        } catch (e) {
            console.error('Error loading preferences:', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Set currency
    const handleSetCurrency = useCallback(async (newCurrency: CurrencyConfig) => {
        try {
            await saveCurrency(newCurrency);
            setCurrencyState(newCurrency);
            updateCachedCurrency(newCurrency);
        } catch (e) {
            console.error('Error saving currency:', e);
            throw e;
        }
    }, []);

    // Format currency using the current preference
    const handleFormatCurrency = useCallback((
        amount: number,
        options?: { showSign?: boolean; compact?: boolean }
    ) => {
        return formatUtil(amount, options);
    }, [currency]);

    // Add custom category
    const handleAddCustomCategory = useCallback(async (category: Omit<CategoryConfig, 'isCustom'>) => {
        try {
            const newCategory: CategoryConfig = { ...category, isCustom: true };
            await addCustomCategoryToStorage(newCategory);
            setCustomCategories(prev => [...prev, newCategory]);
        } catch (e) {
            console.error('Error adding custom category:', e);
            throw e;
        }
    }, []);

    // Delete custom category
    const handleDeleteCustomCategory = useCallback(async (categoryId: string) => {
        try {
            await deleteCustomCategoryFromStorage(categoryId);
            setCustomCategories(prev => prev.filter(c => c.id !== categoryId));
        } catch (e) {
            console.error('Error deleting custom category:', e);
            throw e;
        }
    }, []);

    // Get category by ID
    const getCategoryById = useCallback((categoryId: string): CategoryConfig | undefined => {
        // Check all defaults first
        const allDefaults = [
            ...DEFAULT_EXPENSE_CATEGORIES,
            ...DEFAULT_INCOME_CATEGORIES,
            ...DEFAULT_LENT_CATEGORIES,
            ...DEFAULT_BORROWED_CATEGORIES,
        ];
        const defaultCat = allDefaults.find(c => c.id === categoryId);
        if (defaultCat) return defaultCat;

        // Check custom categories
        return customCategories.find(c => c.id === categoryId);
    }, [customCategories]);

    // Get categories by type
    const getCategoriesByType = useCallback((type: 'expense' | 'income' | 'lent' | 'borrowed'): CategoryConfig[] => {
        const customOfType = customCategories.filter(c => c.type === type);

        switch (type) {
            case 'expense':
                return [...DEFAULT_EXPENSE_CATEGORIES, ...customOfType];
            case 'income':
                return [...DEFAULT_INCOME_CATEGORIES, ...customOfType];
            case 'lent':
                return [...DEFAULT_LENT_CATEGORIES, ...customOfType];
            case 'borrowed':
                return [...DEFAULT_BORROWED_CATEGORIES, ...customOfType];
            default:
                return [...DEFAULT_EXPENSE_CATEGORIES, ...customOfType];
        }
    }, [customCategories]);

    // Derived category lists
    const expenseCategories = getCategoriesByType('expense');
    const incomeCategories = getCategoriesByType('income');
    const lentCategories = getCategoriesByType('lent');
    const borrowedCategories = getCategoriesByType('borrowed');

    const contextValue: PreferencesContextType = {
        // Currency
        currency,
        setCurrency: handleSetCurrency,
        availableCurrencies: CURRENCIES,
        formatCurrency: handleFormatCurrency,
        currencySymbol: currency.symbol,

        // Categories
        expenseCategories,
        incomeCategories,
        lentCategories,
        borrowedCategories,
        customCategories,
        addCustomCategory: handleAddCustomCategory,
        deleteCustomCategory: handleDeleteCustomCategory,
        getCategoryById,
        getCategoriesByType,

        // Loading state
        isLoading,
    };

    return (
        <PreferencesContext.Provider value={contextValue}>
            {children}
        </PreferencesContext.Provider>
    );
}
