import { config } from '../config';
import { connectDatabase } from '../config/database';
import { RoleManagementService } from '../services/roleManagement';
import mongoose from 'mongoose';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Connect to database
const connect = async () => {
  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Initialize roles
const initializeRoles = async () => {
  try {
    // Initialize system roles
    await RoleManagementService.initializeSystemRoles();
    console.log('✅ System roles initialized successfully');
    
    // Initialize custom business roles
    await RoleManagementService.initializeCustomRoles();
    console.log('✅ Custom business roles initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing roles:', error);
  }
};

// Run the initialization script for dummy users
const initializeDummyUsers = async () => {
  try {
    console.log('Running initialization script for dummy users...');
    const { stdout, stderr } = await execPromise('bun run src/server/scripts/initializeRolesAndUsers.ts');
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.error(stderr);
    }
    
    console.log('✅ Dummy users initialization completed');
  } catch (error) {
    console.error('❌ Error running initialization script:', error);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    await connect();
    
    // Initialize roles
    await initializeRoles();
    
    // Initialize dummy users
    await initializeDummyUsers();
    
    console.log('✅ All initialization completed successfully');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the main function
main();

