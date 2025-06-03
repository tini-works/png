import mongoose, { Document, Schema } from 'mongoose';

// Base model interface
export interface IBaseModel extends Document {
  createdAt: Date;
  updatedAt: Date;
}

// Base schema with timestamps
export const baseSchema = new Schema(
  {},
  {
    timestamps: true,
  }
);

// Update timestamp mixin
export interface IUpdateTimestampMixin {
  updatedAt: Date;
}

export const updateTimestampMixin = {
  updatedAt: {
    type: Date,
    default: Date.now,
  },
};

// Helper function for creating mapped columns
export const mapped_column = (options: any = {}) => {
  return options;
};

