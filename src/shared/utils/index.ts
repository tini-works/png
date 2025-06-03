// Format currency
export const formatCurrency = (
  amount: number,
  currency: string = 'VND'
): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

// Format date and time
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('vi-VN');
};

// Format number
export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('vi-VN').format(number);
};

// Calculate due date
export const calculateDueDate = (
  date: Date,
  paymentTerms: number
): Date => {
  const dueDate = new Date(date);
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  return dueDate;
};

// Check if date is overdue
export const isOverdue = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Generate random ID
export const generateId = (length: number = 8): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Format status
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

