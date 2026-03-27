import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';
import { toSafeUser } from '../utils/auth.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ims';

const toUserWithSupplier = (user, supplier) => {
  const safe = toSafeUser(user);
  return {
    ...safe,
    phone: supplier?.phone || safe.phone || '',
    companyName: supplier?.companyName || '',
    businessAddress: supplier?.businessAddress || '',
    supplierCategory: supplier?.supplierCategory || '',
    gstNumber: supplier?.gstNumber || ''
  };
};

async function diagnose() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('--- DATABASE DIAGNOSIS ---');

    const users = await User.find({});
    const supplierProfiles = await Supplier.find({});
    const supplierByUserId = new Map(supplierProfiles.map(p => [String(p.userId), p]));

    for (const user of users) {
      const supplier = supplierByUserId.get(String(user._id));
      const safe = toSafeUser(user);
      const combined = toUserWithSupplier(user, supplier);

      console.log(`User: ${user.email} (${user.role})`);
      console.log(`  DB Phone: "${user.phone}"`);
      console.log(`  Safe Phone: "${safe.phone}"`);
      console.log(`  Combined Phone: "${combined.phone}"`);
      console.log(`  Is Supplier Profile Present: ${!!supplier}`);
      if (supplier) console.log(`  Supplier Phone: "${supplier.phone}"`);
      console.log('---------------------------');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

diagnose();
