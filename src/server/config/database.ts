import mongoose from 'mongoose';
import { config } from './index';

// Connect to MongoDB
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.db.uri);
    console.log('🔌 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed');
  process.exit(0);
});

