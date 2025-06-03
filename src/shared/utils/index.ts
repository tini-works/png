/**
 * Format currency
 * @param amount - Amount to format
 * @param currency - Currency code (e.g., 'VND', 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'VND' ? 0 : 2,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  });
  return formatter.format(amount);
};

/**
 * Format date
 * @param dateString - Date string to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date and time
 * @param dateString - Date string to format
 * @returns Formatted date and time string (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format number
 * @param value - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Calculate exchange rate
 * @param amount - Amount in foreign currency
 * @param amountInVND - Amount in VND
 * @returns Exchange rate
 */
export const calculateExchangeRate = (amount: number, amountInVND: number): number => {
  if (amount === 0) return 0;
  return amountInVND / amount;
};

/**
 * Convert amount to VND
 * @param amount - Amount in foreign currency
 * @param exchangeRate - Exchange rate
 * @returns Amount in VND
 */
export const convertToVND = (amount: number, exchangeRate: number): number => {
  return amount * exchangeRate;
};

/**
 * Truncate text
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

