import mongoose, { Document, Schema } from 'mongoose';
import { User } from './user';

// Expense request status enum
export enum ExpenseRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

// Expense category enum
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

// Expense request interface
export interface IExpenseRequest extends Document {
  requestNumber: string;
  title: string;
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  expenseDate: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

// Expense request schema
const ExpenseRequestSchema = new Schema<IExpenseRequest>(
  {
    requestNumber: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'VND',
    },
    exchangeRate: {
      type: Number,
      min: 0,
    },
    amountInVND: {
      type: Number,
      required: true,
      min: 0,
    },
    vendorName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ExpenseRequestStatus),
      default: ExpenseRequestStatus.DRAFT,
      required: true,
    },
    attachments: {
      type: [String],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate request number
ExpenseRequestSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // Get the last request number
      const lastRequest = await ExpenseRequest.findOne(
        { companyId: this.companyId },
        {},
        { sort: { createdAt: -1 } }
      );

      // Generate new request number
      let nextNumber = 1;
      if (lastRequest && lastRequest.requestNumber) {
        const lastNumber = parseInt(
          lastRequest.requestNumber.split('-')[1] || '0',
          10
        );
        nextNumber = lastNumber + 1;
      }

      // Format: EXP-00001
      this.requestNumber = `EXP-${nextNumber.toString().padStart(5, '0')}`;
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Create and export model
export const ExpenseRequest = mongoose.model<IExpenseRequest>(
  'ExpenseRequest',
  ExpenseRequestSchema
);

