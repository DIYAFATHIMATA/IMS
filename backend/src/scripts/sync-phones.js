import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ims';

async function sync() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find({ role: 'supplier' });
    
    for (const user of users) {
      if (user.phone) {
        await Supplier.updateOne(
          { userId: user._id },
          { $set: { phone: user.phone } }
        );
        console.log(`Synced supplier phone for ${user.email} to ${user.phone}`);
      }
    }
    
    // Also handle any staff who might have empty phones still (just in case)
    const staff = await User.find({ role: 'staff' });
    let base = 9876543100;
    let count = 0;
    for (const u of staff) {
      if (!u.phone) {
        u.phone = String(base + count);
        await u.save();
        console.log(`Assigned phone ${u.phone} to staff ${u.email}`);
        count++;
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

sync();
