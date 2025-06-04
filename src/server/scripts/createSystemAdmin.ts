import mongoose from 'mongoose';
import { config } from '../config';
import { User, UserRole } from '../models/user';
import { Role } from '../models/role';
import bcrypt from 'bcrypt';

// Connect to database
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.db.uri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Create system admin account
const createSystemAdmin = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Check if admin role exists
    const adminRole = await Role.findOne({ roleName: 'ADMINISTRATOR' });
    if (!adminRole) {
      console.error('❌ Administrator role not found. Please run the role initialization script first.');
      process.exit(1);
    }

    // Create a company for the system admin (if needed)
    let companyId;
    const systemCompany = await mongoose.connection.db.collection('companies').findOne({ name: 'System Company' });
    if (systemCompany) {
      companyId = systemCompany._id;
    } else {
      const companyResult = await mongoose.connection.db.collection('companies').insertOne({
        name: 'System Company',
        taxId: 'SYSTEM',
        address: 'System Address',
        phone: '+84 000 000 000',
        email: 'system@example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      companyId = companyResult.insertedId;
      console.log('✅ System company created');
    }

    // Admin credentials
    const adminEmail = 'admin@system.com';
    const adminPassword = 'Admin123!';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`System admin (${adminEmail}) already exists.`);
      
      // Update admin if needed
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.roleIds = [adminRole._id];
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ System admin account updated');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create admin user
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        roleIds: [adminRole._id],
        companyId,
        isActive: true,
      });
      
      console.log('✅ System admin account created');
    }

    console.log('System Admin Credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating system admin:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the script
createSystemAdmin();

