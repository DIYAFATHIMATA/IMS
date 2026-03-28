import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Supplier from '../models/Supplier.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ims';

async function updateCompanies() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const hisham = await User.findOne({ email: 'Hisham@supplier.com' });
    const rohan = await User.findOne({ email: 'Rohan@supplier.com' });

    if (hisham) {
      await Supplier.updateOne(
        { userId: hisham._id },
        { $set: { companyName: 'Tech Supplies Ltd' } }
      );
      console.log('Updated Hisham to Tech Supplies Ltd');
    }

    if (rohan) {
      await Supplier.updateOne(
        { userId: rohan._id },
        { $set: { companyName: 'Tech Supplies Ltd' } }
      );
      console.log('Updated Rohan to Tech Supplies Ltd');
    }

    console.log('Supplier companies updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

updateCompanies();
