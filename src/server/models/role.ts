import mongoose, { Document, Schema } from 'mongoose';

// Role interface
export interface IRole extends Document {
  roleName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Role schema
const roleSchema = new Schema<IRole>(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: {
      type: [String],
      required: true,
      default: [],
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export Role model
export const Role = mongoose.model<IRole>('Role', roleSchema);

