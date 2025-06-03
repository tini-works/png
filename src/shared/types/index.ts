// User types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  USER = 'user',
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Company types
export interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isDefault: boolean;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
}

export interface CompanySettings {
  defaultCurrency: string;
  paymentTerms: number;
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
  };
  paymentMethods: {
    bankTransfer: boolean;
    vnpay: boolean;
    momo: boolean;
    zalopay: boolean;
    cash: boolean;
  };
}

export interface Company {
  _id: string;
  name: string;
  taxId: string;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  bankAccounts: BankAccount[];
  settings: CompanySettings;
  createdAt: string;
  updatedAt: string;
}

// Payment request types
export enum PaymentRequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  VNPAY = 'vnpay',
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  CASH = 'cash',
}

export interface Client {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface Item {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface PaymentDetails {
  transactionId?: string;
  paymentDate?: string;
  paidAmount?: number;
  remainingAmount?: number;
  notes?: string;
}

export interface PaymentRequest {
  _id: string;
  requestNumber: string;
  companyId: string;
  createdBy: string;
  client: Client;
  amount: number;
  currency: string;
  description: string;
  items: Item[];
  subtotal: number;
  taxTotal?: number;
  discountAmount?: number;
  totalAmount: number;
  dueDate: string;
  status: PaymentRequestStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// Expense request types
export enum ExpenseRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum ExpenseCategory {
  TRAVEL = 'travel',
  MEALS = 'meals',
  ACCOMMODATION = 'accommodation',
  OFFICE_SUPPLIES = 'office_supplies',
  TRANSPORTATION = 'transportation',
  ENTERTAINMENT = 'entertainment',
  TRAINING = 'training',
  SOFTWARE = 'software',
  HARDWARE = 'hardware',
  MARKETING = 'marketing',
  OTHER = 'other',
}

export interface ExpenseRequest {
  _id: string;
  requestNumber: string;
  title: string;
  companyId: string;
  userId: string;
  expenseDate: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  amountInVND: number;
  vendorName?: string;
  category: ExpenseCategory;
  description?: string;
  status: ExpenseRequestStatus;
  attachments?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export enum NotificationType {
  PAYMENT_REQUEST_CREATED = 'payment_request_created',
  PAYMENT_REQUEST_UPDATED = 'payment_request_updated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  PAYMENT_REMINDER = 'payment_reminder',
  SYSTEM = 'system',
}

