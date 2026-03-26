import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDefaultUsers } from './seed/seedUsers.js';
import { seedDefaultProducts } from './seed/seedProducts.js';
import { seedCustomers } from './seed/seedCustomers.js';
import { seedDedicatedPurchasesPages } from './seed/seedDedicatedPurchasesPages.js';
import { seedDedicatedCategories } from './seed/seedDedicatedCategories.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultUsers();
    await seedDefaultProducts();
    await seedCustomers();
    await seedDedicatedPurchasesPages();
    await seedDedicatedCategories();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
