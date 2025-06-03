import mongoose, { Document, Schema } from 'mongoose';

// Payment request status enum
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

// Payment method enum
export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  VNPAY = 'vnpay',
  MOMO = 'momo',
  ZALOPAY = 'zalopay',
  CASH = 'cash',
}

// Client interface
interface Client {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

// Item interface
interface Item {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

// Payment details interface
interface PaymentDetails {
  transactionId?: string;
  paymentDate?: Date;
  paidAmount?: number;
  remainingAmount?: number;
  notes?: string;
}

// Payment request interface
export interface IPaymentRequest extends Document {
  requestNumber: string;
  companyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  client: Client;
  amount: number;
  currency: string;
  description: string;
  items: Item[];
  subtotal: number;
  taxTotal?: number;
  discountAmount?: number;
  totalAmount: number;
  dueDate: Date;
  status: PaymentRequestStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Payment request schema
const paymentRequestSchema = new Schema<IPaymentRequest>(
  {
    requestNumber: {
      type: String,
      unique: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      taxId: {
        type: String,
        trim: true,
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'VND',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    items: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        taxRate: {
          type: Number,
          min: 0,
        },
        taxAmount: {
          type: Number,
          min: 0,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxTotal: {
      type: Number,
      min: 0,
    },
    discountAmount: {
      type: Number,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentRequestStatus),
      default: PaymentRequestStatus.DRAFT,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    paymentDetails: {
      transactionId: {
        type: String,
        trim: true,
      },
      paymentDate: {
        type: Date,
      },
      paidAmount: {
        type: Number,
        min: 0,
      },
      remainingAmount: {
        type: Number,
        min: 0,
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate request number before saving
paymentRequestSchema.pre('save', async function (next) {
  // Only generate request number if it's a new document
  if (this.isNew) {
    try {
      // Get current date
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');

      // Get count of payment requests for the current month
      const count = await mongoose.model('PaymentRequest').countDocuments({
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      });

      // Generate request number: PR-YY-MM-XXXX
      this.requestNumber = `PR-${year}-${month}-${(count + 1)
        .toString()
        .padStart(4, '0')}`;

      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

// Create and export PaymentRequest model
export const PaymentRequest = mongoose.model<IPaymentRequest>(
  'PaymentRequest',
  paymentRequestSchema
);

