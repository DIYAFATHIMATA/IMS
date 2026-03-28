import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ims';

const CATEGORIES = [
  { name: 'Electronics', description: 'Advanced technology, consumer electronics, and digital gadgets.' },
  { name: 'Groceries', description: 'Daily food items, pantry staples, and fresh household essentials.' },
  { name: 'Furniture', description: 'Modern office and home furniture for professional and residential spaces.' },
  { name: 'Stationery', description: 'Premium paper products, writing instruments, and office supplies.' },
  { name: 'Clothing', description: 'Stylish apparel, fashion wear, and garment collections for all seasons.' },
  { name: 'Accessories', description: 'Luxury personal accessories including watches, bags, and fashion accents.' },
  { name: 'Hardware', description: 'Professional tools, industrial supplies, and maintenance equipment.' },
  { name: 'Appliances', description: 'Modern home and kitchen appliances for efficient living.' }
];

async function seedCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // To ensure a clean state as per the user's "fill in that space properly" request, 
    // we clear existing categories and insert the fresh 8 ones.
    await Category.deleteMany({});
    console.log('Cleared existing categories.');

    const created = await Category.insertMany(CATEGORIES);
    console.log(`Successfully seeded ${created.length} categories.`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedCategories();
