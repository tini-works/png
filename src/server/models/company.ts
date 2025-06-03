import mongoose, { Document, Schema } from 'mongoose';

// Bank account interface
interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isDefault: boolean;
}

// Address interface
interface Address {
  street: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
}

// Company settings interface
interface CompanySettings {
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

// Company interface
export interface ICompany extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

// Company schema
const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    taxId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      province: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: 'Vietnam',
      },
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    bankAccounts: [
      {
        bankName: {
          type: String,
          required: true,
          trim: true,
        },
        accountNumber: {
          type: String,
          required: true,
          trim: true,
        },
        accountHolder: {
          type: String,
          required: true,
          trim: true,
        },
        branch: {
          type: String,
          trim: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    settings: {
      defaultCurrency: {
        type: String,
        default: 'VND',
      },
      paymentTerms: {
        type: Number,
        default: 30,
      },
      notificationPreferences: {
        email: {
          type: Boolean,
          default: true,
        },
        inApp: {
          type: Boolean,
          default: true,
        },
      },
      paymentMethods: {
        bankTransfer: {
          type: Boolean,
          default: true,
        },
        vnpay: {
          type: Boolean,
          default: false,
        },
        momo: {
          type: Boolean,
          default: false,
        },
        zalopay: {
          type: Boolean,
          default: false,
        },
        cash: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create and export Company model
export const Company = mongoose.model<ICompany>('Company', companySchema);

