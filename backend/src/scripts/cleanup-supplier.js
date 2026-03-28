import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Supplier from '../models/Supplier.js';
import SupplyRequest from '../models/SupplyRequest.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ims';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const supplier = await Supplier.findOne({ companyName: /Primary Supplier Co/i });
    if (!supplier) {
      console.log('Supplier "Primary Supplier Co" not found.');
    } else {
      const deletedRequests = await SupplyRequest.deleteMany({ supplierId: supplier._id });
      console.log(`Deleted ${deletedRequests.deletedCount} supply requests for Primary Supplier Co.`);
      
      await Supplier.deleteOne({ _id: supplier._id });
      console.log('Deleted "Primary Supplier Co" supplier entry.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
