import Product from '../models/Product.js';

const defaultProducts = [
  { name: 'Wireless Ergonomic Mouse', category: 'Electronics', price: 1299, costPrice: 800, stock: 45, gst: 18, sku: 'PROD-00101' },
  { name: 'Mechanical Keyboard RGB', category: 'Electronics', price: 4500, costPrice: 3200, stock: 12, gst: 18, sku: 'PROD-00102' },
  { name: 'Office Chair - Mesh', category: 'Furniture', price: 8999, costPrice: 6000, stock: 5, gst: 18, sku: 'PROD-00103' },
  { name: 'USB-C Hub Multiport', category: 'Electronics', price: 2499, costPrice: 1500, stock: 30, gst: 18, sku: 'PROD-00104' },
  { name: 'A4 Paper Ream (500 Sheets)', category: 'Stationery', price: 250, costPrice: 180, stock: 100, gst: 12, sku: 'PROD-00105' },
  { name: '27-inch 4K Monitor', category: 'Electronics', price: 28000, costPrice: 22000, stock: 8, gst: 18, sku: 'PROD-00106' },
  { name: 'HDMI Cable 2m', category: 'Electronics', price: 450, costPrice: 200, stock: 50, gst: 18, sku: 'PROD-00107' },
  { name: 'Desk Organizer Set', category: 'Stationery', price: 899, costPrice: 500, stock: 25, gst: 12, sku: 'PROD-00108' }
];

export const seedDefaultProducts = async () => {
  const count = await Product.countDocuments();

  if (count > 0) {
    return;
  }

  await Product.insertMany(defaultProducts);
};
