import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Utensils,
    ShoppingBag,
    Car,
    Zap,
    Heart,
    Home,
    Film,
    GraduationCap,
    Dumbbell,
    Plane,
    Gift,
    Smartphone,
    Briefcase,
    Coffee,
    TrendingUp,
    DollarSign,
    Users,
    HandCoins,
    Music,
    Gamepad2,
    PawPrint,
    Stethoscope,
    Baby,
    Palette,
    Book,
    Hammer,
    Wifi,
    CreditCard,
    Banknote,
    PiggyBank,
    Landmark,
    CircleDollarSign,
    Coins,
    Receipt,
    Tag,
    MoreHorizontal
} from 'lucide-react-native';
import { LucideIcon } from 'lucide-react-native';

// Storage keys
const CURRENCY_KEY = 'user_currency';
const CUSTOM_CATEGORIES_KEY = 'custom_categories';

// ==================== CURRENCY CONFIGURATION ====================

export interface CurrencyConfig {
    code: string;
    symbol: string;
    name: string;
    locale: string;
    position: 'prefix' | 'suffix'; // Symbol before or after amount
}

// Predefined currency options
export const CURRENCIES: CurrencyConfig[] = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', position: 'prefix' },
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', position: 'prefix' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', position: 'prefix' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', position: 'prefix' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', position: 'prefix' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN', position: 'prefix' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', position: 'prefix' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', position: 'prefix' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', position: 'prefix' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', position: 'prefix' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', position: 'prefix' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA', position: 'prefix' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR', position: 'prefix' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', position: 'prefix' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX', position: 'prefix' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', position: 'prefix' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU', position: 'prefix' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH', position: 'prefix' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID', position: 'prefix' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY', position: 'prefix' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'fil-PH', position: 'prefix' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN', position: 'suffix' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK', position: 'prefix' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'bn-BD', position: 'prefix' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG', position: 'prefix' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound', locale: 'ar-EG', position: 'prefix' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', locale: 'tr-TR', position: 'prefix' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL', position: 'suffix' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE', position: 'suffix' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO', position: 'suffix' },
];

// Default currency
export const DEFAULT_CURRENCY: CurrencyConfig = CURRENCIES[0]; // INR

// ==================== CATEGORY CONFIGURATION ====================

export interface CategoryConfig {
    id: string;
    label: string;
    icon: string; // Icon name as string
    color: string;
    type: 'expense' | 'income' | 'lent' | 'borrowed';
    isCustom?: boolean;
}

// Icon name to component mapping
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Utensils,
    ShoppingBag,
    Car,
    Zap,
    Heart,
    Home,
    Film,
    GraduationCap,
    Dumbbell,
    Plane,
    Gift,
    Smartphone,
    Briefcase,
    Coffee,
    TrendingUp,
    DollarSign,
    Users,
    HandCoins,
    Music,
    Gamepad2,
    PawPrint,
    Stethoscope,
    Baby,
    Palette,
    Book,
    Hammer,
    Wifi,
    CreditCard,
    Banknote,
    PiggyBank,
    Landmark,
    CircleDollarSign,
    Coins,
    Receipt,
    Tag,
    MoreHorizontal,
};

// Get icon component from name
export const getIconComponent = (iconName: string): LucideIcon => {
    return CATEGORY_ICONS[iconName] || DollarSign;
};

// Default expense categories
export const DEFAULT_EXPENSE_CATEGORIES: CategoryConfig[] = [
    { id: 'food', label: 'Food & Dining', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
    { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', type: 'expense' },
    { id: 'transport', label: 'Transport', icon: 'Car', color: '#3B82F6', type: 'expense' },
    { id: 'bills', label: 'Bills & Utilities', icon: 'Zap', color: '#8B5CF6', type: 'expense' },
    { id: 'health', label: 'Healthcare', icon: 'Heart', color: '#EF4444', type: 'expense' },
    { id: 'home', label: 'Home & Rent', icon: 'Home', color: '#10B981', type: 'expense' },
    { id: 'entertainment', label: 'Entertainment', icon: 'Film', color: '#F97316', type: 'expense' },
    { id: 'education', label: 'Education', icon: 'GraduationCap', color: '#6366F1', type: 'expense' },
    { id: 'fitness', label: 'Fitness', icon: 'Dumbbell', color: '#14B8A6', type: 'expense' },
    { id: 'travel', label: 'Travel', icon: 'Plane', color: '#0EA5E9', type: 'expense' },
    { id: 'gifts', label: 'Gifts', icon: 'Gift', color: '#D946EF', type: 'expense' },
    { id: 'phone', label: 'Phone & Internet', icon: 'Smartphone', color: '#64748B', type: 'expense' },
    { id: 'groceries', label: 'Groceries', icon: 'ShoppingBag', color: '#22C55E', type: 'expense' },
    { id: 'pets', label: 'Pets', icon: 'PawPrint', color: '#A855F7', type: 'expense' },
    { id: 'subscriptions', label: 'Subscriptions', icon: 'CreditCard', color: '#0891B2', type: 'expense' },
    { id: 'personal', label: 'Personal Care', icon: 'Heart', color: '#FB7185', type: 'expense' },
];

// Default income categories
export const DEFAULT_INCOME_CATEGORIES: CategoryConfig[] = [
    { id: 'salary', label: 'Salary', icon: 'Briefcase', color: '#22C55E', type: 'income' },
    { id: 'freelance', label: 'Freelance', icon: 'Coffee', color: '#3B82F6', type: 'income' },
    { id: 'business', label: 'Business', icon: 'TrendingUp', color: '#8B5CF6', type: 'income' },
    { id: 'investment', label: 'Investment', icon: 'DollarSign', color: '#F59E0B', type: 'income' },
    { id: 'bonus', label: 'Bonus', icon: 'Gift', color: '#EC4899', type: 'income' },
    { id: 'refund', label: 'Refund', icon: 'Receipt', color: '#14B8A6', type: 'income' },
    { id: 'dividends', label: 'Dividends', icon: 'PiggyBank', color: '#6366F1', type: 'income' },
    { id: 'rental', label: 'Rental Income', icon: 'Home', color: '#0EA5E9', type: 'income' },
    { id: 'other_income', label: 'Other Income', icon: 'Coins', color: '#64748B', type: 'income' },
];

// Default lent categories
export const DEFAULT_LENT_CATEGORIES: CategoryConfig[] = [
    { id: 'lent_friend', label: 'Lent to Friend', icon: 'Users', color: '#3B82F6', type: 'lent' },
    { id: 'lent_family', label: 'Lent to Family', icon: 'Heart', color: '#EC4899', type: 'lent' },
    { id: 'lent_other', label: 'Lent to Other', icon: 'HandCoins', color: '#8B5CF6', type: 'lent' },
];

// Default borrowed categories
export const DEFAULT_BORROWED_CATEGORIES: CategoryConfig[] = [
    { id: 'borrowed_friend', label: 'Borrowed from Friend', icon: 'Users', color: '#3B82F6', type: 'borrowed' },
    { id: 'borrowed_family', label: 'Borrowed from Family', icon: 'Heart', color: '#EC4899', type: 'borrowed' },
    { id: 'borrowed_bank', label: 'Bank Loan', icon: 'Landmark', color: '#F59E0B', type: 'borrowed' },
    { id: 'borrowed_other', label: 'Borrowed from Other', icon: 'HandCoins', color: '#8B5CF6', type: 'borrowed' },
];

// All default categories combined
export const ALL_DEFAULT_CATEGORIES: CategoryConfig[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
    ...DEFAULT_LENT_CATEGORIES,
    ...DEFAULT_BORROWED_CATEGORIES,
];

// ==================== STORAGE FUNCTIONS ====================

// Currency functions
export async function getCurrency(): Promise<CurrencyConfig> {
    try {
        const stored = await AsyncStorage.getItem(CURRENCY_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Validate it's a valid currency
            const found = CURRENCIES.find(c => c.code === parsed.code);
            return found || DEFAULT_CURRENCY;
        }
        return DEFAULT_CURRENCY;
    } catch {
        return DEFAULT_CURRENCY;
    }
}

export async function setCurrency(currency: CurrencyConfig): Promise<void> {
    try {
        await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
    } catch (e) {
        console.error('Error saving currency:', e);
    }
}

// Custom categories functions
export async function getCustomCategories(): Promise<CategoryConfig[]> {
    try {
        const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch {
        return [];
    }
}

export async function saveCustomCategories(categories: CategoryConfig[]): Promise<void> {
    try {
        await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (e) {
        console.error('Error saving custom categories:', e);
    }
}

export async function addCustomCategory(category: CategoryConfig): Promise<void> {
    try {
        const existing = await getCustomCategories();
        const updated = [...existing, { ...category, isCustom: true }];
        await saveCustomCategories(updated);
    } catch (e) {
        console.error('Error adding custom category:', e);
    }
}

export async function deleteCustomCategory(categoryId: string): Promise<void> {
    try {
        const existing = await getCustomCategories();
        const updated = existing.filter(c => c.id !== categoryId);
        await saveCustomCategories(updated);
    } catch (e) {
        console.error('Error deleting custom category:', e);
    }
}

// Get all categories (default + custom) for a specific type
export async function getCategoriesByType(type: 'expense' | 'income' | 'lent' | 'borrowed'): Promise<CategoryConfig[]> {
    const customCategories = await getCustomCategories();
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
}

// Get category by ID
export async function getCategoryById(categoryId: string): Promise<CategoryConfig | undefined> {
    // Check defaults first
    const defaultCat = ALL_DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    if (defaultCat) return defaultCat;

    // Check custom categories
    const customCategories = await getCustomCategories();
    return customCategories.find(c => c.id === categoryId);
}

// Get category color by ID (sync version using cached/default)
export function getCategoryColor(categoryId: string): string {
    const found = ALL_DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return found?.color || '#64748B'; // Default gray
}

// Get category icon name by ID (sync version)
export function getCategoryIconName(categoryId: string): string {
    const found = ALL_DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return found?.icon || 'DollarSign';
}

// Available icon names for custom categories
export const AVAILABLE_ICONS = Object.keys(CATEGORY_ICONS);

// Available colors for custom categories
export const AVAILABLE_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#64748B', // Slate
];
