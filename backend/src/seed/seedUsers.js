import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';

const defaultUsers = [
  {
    name: 'System Admin',
    email: 'admin@demo.com',
    password: 'admin',
    role: 'admin'
  },
  {
    name: 'Store Staff',
    email: 'staff@demo.com',
    password: 'staff',
    role: 'staff'
  },
  {
    name: 'Primary Supplier',
    email: 'supplier@demo.com',
    password: 'supplier',
    role: 'supplier'
  }
];

export const seedDefaultUsers = async () => {
  await User.updateMany({ role: 'manager' }, { $set: { role: 'staff' } });

  for (const account of defaultUsers) {
    const existingUser = await User.findOne({ email: account.email });
    if (existingUser) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(account.password, 10);

    await User.create({
      name: account.name,
      email: account.email,
      password: hashedPassword,
      role: account.role
    });
  }

  const defaultSupplierUser = await User.findOne({ email: 'supplier@demo.com', role: 'supplier' });
  if (defaultSupplierUser) {
    const existingProfile = await Supplier.findOne({ userId: defaultSupplierUser._id });
    if (!existingProfile) {
      await Supplier.create({
        userId: defaultSupplierUser._id,
        companyName: 'Primary Supplier Co',
        phone: '9876543210',
        businessAddress: 'Kochi, Kerala',
        supplierCategory: 'General Goods',
        gstNumber: ''
      });
    }
  }
};
