import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ims';

const PRODUCT_SEEDS = [
  { category: 'Electronics', company: 'Tech Supplies Ltd', supplierEmail: 'Hisham@supplier.com', products: ['Laptop', 'Monitor'] },
  { category: 'Groceries', company: 'FreshMart Suppliers', supplierEmail: 'Rohan@supplier.com', products: ['Rice', 'Cooking Oil'] },
  { category: 'Furniture', company: 'Comfort Furniture Co', supplierEmail: 'Arjun@supplier.com', products: ['Office Chair', 'Table'] },
  { category: 'Stationery', company: 'WriteWell Supplies', supplierEmail: 'Sana@supplier.com', products: ['Notebook', 'Pen'] },
  { category: 'Clothing', company: 'UniformHub Ltd', supplierEmail: 'Aisha@supplier.com', products: ['Uniform Shirt', 'Safety Vest'] },
  { category: 'Accessories', company: 'AccessoryWorld', supplierEmail: 'Adil@supplier.com', products: ['USB Cable', 'Adapter'] },
  { category: 'Hardware', company: 'BuildPro Hardware', supplierEmail: 'Vishal@supplier.com', products: ['Hammer', 'Screwdriver'] },
  { category: 'Appliances', company: 'HomeTech Appliances', supplierEmail: 'Imran@supplier.com', products: ['Electric Kettle', 'Water Dispenser'] }
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products to start fresh
    await Product.deleteMany({});
    console.log('Cleared existing products');

    for (const seed of PRODUCT_SEEDS) {
      const user = await User.findOne({ email: seed.supplierEmail });
      if (!user) {
        console.warn(`User ${seed.supplierEmail} not found. Skipping ${seed.category}`);
        continue;
      }

      const supplier = await Supplier.findOne({ userId: user._id });
      if (!supplier) {
        console.warn(`Supplier record for ${seed.supplierEmail} not found. Skipping ${seed.category}`);
        continue;
      }

      for (const productName of seed.products) {
        const sku = `${seed.category.substring(0, 3).toUpperCase()}-${productName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        
        await Product.create({
          name: productName,
          category: seed.category,
          price: 1000, 
          costPrice: 800,
          stock: 50,
          minStockLevel: 10,
          supplierId: supplier._id, // This links to the Supplier record ID
          companyName: seed.company,
          gst: 18,
          sku: sku
        });
        console.log(`Created product: ${productName} (${seed.category}) linked to ${seed.company}`);
      }
    }

    console.log('Product seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedProducts();
