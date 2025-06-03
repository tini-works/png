import mongoose, { Document, Schema } from 'mongoose';

// Notification type enum
export enum NotificationType {
  PAYMENT_REQUEST_CREATED = 'payment_request_created',
  PAYMENT_REQUEST_UPDATED = 'payment_request_updated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_OVERDUE = 'payment_overdue',
  PAYMENT_REMINDER = 'payment_reminder',
  SYSTEM = 'system',
}

// Notification interface
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedTo?: {
    model: string;
    documentId: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedTo: {
      model: {
        type: String,
        enum: ['PaymentRequest', 'User', 'Company'],
      },
      documentId: {
        type: Schema.Types.ObjectId,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create and export Notification model
export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

