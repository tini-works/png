import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  USER = 'user',
}

// User interface
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole; // Keep for backward compatibility
  roleIds: mongoose.Types.ObjectId[]; // New field for role-based access control
  companyId: mongoose.Types.ObjectId;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): Promise<boolean>; // New method to check permissions
}

// User schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    roleIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Role',
      default: [],
    }],
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has a specific permission
userSchema.methods.hasPermission = async function (
  permission: string
): Promise<boolean> {
  try {
    // Populate roles if not already populated
    const user = this.roleIds && this.roleIds[0] instanceof mongoose.Types.ObjectId
      ? await this.populate('roleIds')
      : this;
    
    // Check if any of the user's roles have the required permission
    for (const role of user.roleIds) {
      if (role.permissions && role.permissions.includes(permission)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

// Create and export User model
export const User = mongoose.model<IUser>('User', userSchema);
