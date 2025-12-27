import { CurrencyConfig, DEFAULT_CURRENCY, getCurrency as getCurrencyFromStorage } from '../lib/preferences';

// In-memory cache for currency to avoid async calls in render
let cachedCurrency: CurrencyConfig = DEFAULT_CURRENCY;
let currencyLoaded = false;

/**
 * Initialize the currency from storage (call this at app startup)
 */
export async function initializeCurrency(): Promise<CurrencyConfig> {
    try {
        cachedCurrency = await getCurrencyFromStorage();
        currencyLoaded = true;
        return cachedCurrency;
    } catch {
        cachedCurrency = DEFAULT_CURRENCY;
        currencyLoaded = true;
        return cachedCurrency;
    }
}

/**
 * Update the cached currency (call this when user changes currency)
 */
export function updateCachedCurrency(currency: CurrencyConfig): void {
    cachedCurrency = currency;
    currencyLoaded = true;
}

/**
 * Get the current cached currency
 */
export function getCurrentCurrency(): CurrencyConfig {
    return cachedCurrency;
}

/**
 * Check if currency has been loaded from storage
 */
export function isCurrencyLoaded(): boolean {
    return currencyLoaded;
}

/**
 * Format a number as currency using the user's preferred currency
 * @param amount The amount to format
 * @param options Optional formatting options
 */
export function formatCurrency(
    amount: number,
    options?: {
        showSign?: boolean;           // Show + or - prefix
        compact?: boolean;            // Use compact notation (1K, 1M)
        decimals?: number;            // Number of decimal places (default: 0 for most, 2 for USD/EUR)
        currencyOverride?: CurrencyConfig; // Override the cached currency
    }
): string {
    const currency = options?.currencyOverride || cachedCurrency;

    try {
        // Determine decimal places based on currency
        let decimals = options?.decimals;
        if (decimals === undefined) {
            // Default: 0 for INR, JPY, KRW; 2 for others
            const noDecimalCurrencies = ['INR', 'JPY', 'KRW', 'VND', 'IDR'];
            decimals = noDecimalCurrencies.includes(currency.code) ? 0 : 2;
        }

        const formatter = new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            ...(options?.compact && { notation: 'compact' }),
        });

        let formatted = formatter.format(Math.abs(amount));

        // Add sign if requested
        if (options?.showSign) {
            if (amount >= 0) {
                formatted = '+' + formatted;
            } else {
                formatted = '-' + formatted;
            }
        } else if (amount < 0) {
            formatted = '-' + formatted;
        }

        return formatted;
    } catch {
        // Fallback formatting
        const sign = options?.showSign && amount >= 0 ? '+' : (amount < 0 ? '-' : '');
        return `${sign}${currency.symbol}${Math.abs(amount).toFixed(options?.decimals ?? 0)}`;
    }
}

/**
 * Format currency with the integer and decimal parts split
 * Useful for displaying large amounts with different styling
 */
export function formatCurrencySplit(amount: number): { symbol: string; integer: string; decimal: string } {
    const currency = cachedCurrency;

    try {
        const formatter = new Intl.NumberFormat(currency.locale, {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });

        const formatted = formatter.format(Math.abs(amount));
        const parts = formatted.split('.');

        return {
            symbol: currency.symbol,
            integer: parts[0],
            decimal: parts[1] || '',
        };
    } catch {
        const str = Math.abs(amount).toFixed(2);
        const parts = str.split('.');

        return {
            symbol: currency.symbol,
            integer: parts[0],
            decimal: parts[1] || '',
        };
    }
}

/**
 * Get just the currency symbol
 */
export function getCurrencySymbol(): string {
    return cachedCurrency.symbol;
}

/**
 * Format a date according to the user's locale
 */
export function formatDate(
    date: string | Date,
    options?: {
        style?: 'full' | 'long' | 'medium' | 'short';
        includeTime?: boolean;
    }
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const currency = cachedCurrency;

    try {
        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: options?.style === 'short' ? 'short' : 'long',
            day: 'numeric',
        };

        if (options?.includeTime) {
            dateOptions.hour = '2-digit';
            dateOptions.minute = '2-digit';
        }

        return dateObj.toLocaleDateString(currency.locale, dateOptions);
    } catch {
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date): string {
    return formatDate(date, { includeTime: true });
}

/**
 * Get relative time string (e.g., "2 hours ago", "Yesterday")
 */
export function getRelativeTime(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(date, { style: 'short' });
}

/**
 * Format a number with localized grouping (e.g., 1,00,000 for INR or 100,000 for USD)
 */
export function formatNumber(amount: number, decimals: number = 0): string {
    const currency = cachedCurrency;

    try {
        return new Intl.NumberFormat(currency.locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(amount);
    } catch {
        return amount.toFixed(decimals);
    }
}
