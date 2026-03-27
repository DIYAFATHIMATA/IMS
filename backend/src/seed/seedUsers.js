import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';

const defaultUsers = [
  {
    name: 'System Admin',
    email: 'admin@ims.com',
    password: 'admin',
    role: 'admin',
    phone: ''
  },
  {
    name: 'Rahul',
    email: 'Rahul@staff.com',
    password: 'staff',
    role: 'staff',
    phone: '9876543211'
  },
  {
    name: 'Priya',
    email: 'Priya@staff.com',
    password: 'staff',
    role: 'staff',
    phone: '9876543212'
  },
  {
    name: 'Hisham',
    email: 'Hisham@supplier.com',
    password: 'supplier',
    role: 'supplier',
    phone: '9876543213'
  },
  {
    name: 'Rohan',
    email: 'Rohan@supplier.com',
    password: 'supplier',
    role: 'supplier',
    phone: '9876543214'
  }
];

export const seedDefaultUsers = async () => {
  const legacyEmails = ['admin@demo.com', 'staff@demo.com', 'supplier@demo.com', 'manager@demo.com'];
  await User.deleteMany({ email: { $in: legacyEmails } });

  await User.updateMany({ role: 'manager' }, { $set: { role: 'staff' } });

  for (const account of defaultUsers) {
    const existingUser = await User.findOne({ email: account.email });
    if (existingUser) {
      if (existingUser.phone !== (account.phone || '')) {
        existingUser.phone = account.phone || '';
        await existingUser.save();
      }
      continue;
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    await User.create({
      name: account.name,
      email: account.email,
      password: hashedPassword,
      role: account.role,
      phone: account.phone || ''
    });
  }

  const supplierUsers = await User.find({ role: 'supplier' });
  for (const supplierUser of supplierUsers) {
    const existingProfile = await Supplier.findOne({ userId: supplierUser._id });
    if (!existingProfile) {
      await Supplier.create({
        userId: supplierUser._id,
        companyName: `${supplierUser.name} Co`,
        phone: '9876543210',
        businessAddress: 'Kochi, Kerala',
        supplierCategory: 'General Goods',
        gstNumber: ''
      });
    }
  }
};
