import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Transaction } from '../lib/types';
import { Alert, Platform } from 'react-native';
import {
    formatCurrency as formatCurrencyUtil,
    formatDate as formatDateUtil,
    getCurrentCurrency
} from './formatting';

/**
 * Format currency for export (uses user's preferred currency)
 */
const formatCurrency = (amount: number): string => {
    return formatCurrencyUtil(amount);
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
    return formatDateUtil(dateString, { style: 'short' });
};

/**
 * Generate CSV content from transactions
 */
export const generateCSV = (
    transactions: Transaction[],
    monthName: string,
    year: number,
    totals: { income: number; expense: number; balance: number }
): string => {
    // CSV Header
    let csv = 'Date,Description,Category,Type,Amount\n';

    // Add transactions
    transactions.forEach(tx => {
        const row = [
            formatDate(tx.date),
            `"${tx.title.replace(/"/g, '""')}"`, // Escape quotes in title
            tx.category,
            tx.type,
            tx.amount.toString(),
        ];
        csv += row.join(',') + '\n';
    });

    // Add summary
    csv += '\n';
    csv += `Summary for ${monthName} ${year}\n`;
    csv += `Total Income,${totals.income}\n`;
    csv += `Total Expense,${totals.expense}\n`;
    csv += `Net Balance,${totals.balance}\n`;

    return csv;
};

/**
 * Generate HTML content for PDF
 */
export const generatePDFHTML = (
    transactions: Transaction[],
    monthName: string,
    year: number,
    totals: { income: number; expense: number; balance: number },
    username: string
): string => {
    const currencySymbol = getCurrentCurrency().symbol;

    const transactionRows = transactions
        .map(tx => `
            <tr>
                <td>${formatDate(tx.date)}</td>
                <td>${tx.title}</td>
                <td><span class="category">${tx.category}</span></td>
                <td><span class="type type-${tx.type}">${tx.type}</span></td>
                <td class="${tx.type === 'income' || tx.type === 'borrowed' ? 'amount-positive' : 'amount-negative'}">
                    ${tx.type === 'income' || tx.type === 'borrowed' ? '+' : '-'}${formatCurrency(tx.amount)}
                </td>
            </tr>
        `)
        .join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Money Brain Report - ${monthName} ${year}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: #f8fafc;
                color: #1e293b;
                padding: 40px;
                line-height: 1.5;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e2e8f0;
            }
            .logo {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .logo-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #36e27b, #22c55e);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 24px;
            }
            .logo-text {
                font-size: 24px;
                font-weight: 700;
                color: #0f172a;
            }
            .report-info {
                text-align: right;
            }
            .report-title {
                font-size: 18px;
                font-weight: 600;
                color: #0f172a;
            }
            .report-period {
                font-size: 14px;
                color: #64748b;
                margin-top: 4px;
            }
            .summary-cards {
                display: flex;
                gap: 20px;
                margin-bottom: 40px;
            }
            .summary-card {
                flex: 1;
                padding: 24px;
                border-radius: 16px;
                background: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .summary-card.income {
                border-left: 4px solid #22c55e;
            }
            .summary-card.expense {
                border-left: 4px solid #ef4444;
            }
            .summary-card.balance {
                border-left: 4px solid #3b82f6;
            }
            .summary-label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #64748b;
                margin-bottom: 8px;
            }
            .summary-value {
                font-size: 28px;
                font-weight: 700;
            }
            .summary-card.income .summary-value { color: #22c55e; }
            .summary-card.expense .summary-value { color: #ef4444; }
            .summary-card.balance .summary-value { color: #3b82f6; }
            
            .transactions-section {
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #0f172a;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th {
                text-align: left;
                padding: 12px 16px;
                background: #f8fafc;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #64748b;
                border-bottom: 2px solid #e2e8f0;
            }
            td {
                padding: 16px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 14px;
            }
            tr:last-child td {
                border-bottom: none;
            }
            .category {
                display: inline-block;
                padding: 4px 12px;
                background: #f1f5f9;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                text-transform: capitalize;
            }
            .type {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: capitalize;
            }
            .type-income { background: #dcfce7; color: #166534; }
            .type-expense { background: #fee2e2; color: #991b1b; }
            .type-borrowed { background: #dbeafe; color: #1e40af; }
            .type-lent { background: #fef3c7; color: #92400e; }
            
            .amount-positive { color: #22c55e; font-weight: 600; }
            .amount-negative { color: #ef4444; font-weight: 600; }
            
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
            }
            .no-data {
                text-align: center;
                padding: 40px;
                color: #64748b;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">
                <div class="logo-icon">${currencySymbol}</div>
                <span class="logo-text">Money Brain</span>
            </div>
            <div class="report-info">
                <div class="report-title">Financial Report</div>
                <div class="report-period">${monthName} ${year} • ${username}</div>
            </div>
        </div>

        <div class="summary-cards">
            <div class="summary-card income">
                <div class="summary-label">Total Income</div>
                <div class="summary-value">${formatCurrency(totals.income)}</div>
            </div>
            <div class="summary-card expense">
                <div class="summary-label">Total Expenses</div>
                <div class="summary-value">${formatCurrency(totals.expense)}</div>
            </div>
            <div class="summary-card balance">
                <div class="summary-label">Net Balance</div>
                <div class="summary-value">${totals.balance >= 0 ? '+' : ''}${formatCurrency(totals.balance)}</div>
            </div>
        </div>

        <div class="transactions-section">
            <div class="section-title">Transactions (${transactions.length})</div>
            ${transactions.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactionRows}
                </tbody>
            </table>
            ` : '<div class="no-data">No transactions found for this period.</div>'}
        </div>

        <div class="footer">
            Generated by Money Brain • ${new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
        </div>
    </body>
    </html>
    `;
};

/**
 * Export transactions to CSV file and share
 */
export const exportToCSV = async (
    transactions: Transaction[],
    monthName: string,
    year: number,
    totals: { income: number; expense: number; balance: number }
): Promise<boolean> => {
    try {
        const csvContent = generateCSV(transactions, monthName, year, totals);
        const fileName = `MoneyBrain_${monthName}_${year}.csv`;
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;

        // Write file
        await FileSystem.writeAsStringAsync(filePath, csvContent, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('Error', 'Sharing is not available on this device');
            return false;
        }

        // Share the file
        await Sharing.shareAsync(filePath, {
            mimeType: 'text/csv',
            dialogTitle: `Export ${monthName} ${year} Report`,
            UTI: 'public.comma-separated-values-text',
        });

        return true;
    } catch (error) {
        console.error('Error exporting CSV:', error);
        Alert.alert('Export Failed', 'Could not export CSV file. Please try again.');
        return false;
    }
};

/**
 * Export transactions to PDF and share
 */
export const exportToPDF = async (
    transactions: Transaction[],
    monthName: string,
    year: number,
    totals: { income: number; expense: number; balance: number },
    username: string
): Promise<boolean> => {
    try {
        const htmlContent = generatePDFHTML(transactions, monthName, year, totals, username);

        // Generate PDF
        const { uri } = await Print.printToFileAsync({
            html: htmlContent,
            base64: false,
        });

        // Rename file to something meaningful
        const fileName = `MoneyBrain_${monthName}_${year}.pdf`;
        const newPath = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.moveAsync({
            from: uri,
            to: newPath,
        });

        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('Error', 'Sharing is not available on this device');
            return false;
        }

        // Share the file
        await Sharing.shareAsync(newPath, {
            mimeType: 'application/pdf',
            dialogTitle: `Export ${monthName} ${year} Report`,
            UTI: 'com.adobe.pdf',
        });

        return true;
    } catch (error) {
        console.error('Error exporting PDF:', error);
        Alert.alert('Export Failed', 'Could not export PDF file. Please try again.');
        return false;
    }
};
