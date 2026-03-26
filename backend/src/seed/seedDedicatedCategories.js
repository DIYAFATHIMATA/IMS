import Category from '../models/Category.js';

const defaultCategories = [
  { name: 'Groceries', description: 'Daily food items and household essentials' },
  { name: 'Furniture', description: 'Office and home furniture' },
  { name: 'Stationery', description: 'Paper, pens, and office supplies' },
  { name: 'Electronics', description: 'Gadgets and devices' }
];

export const seedDedicatedCategories = async () => {
  const count = await Category.countDocuments();
  if (count > 0) {
    return;
  }

  await Category.insertMany(defaultCategories);
};
