import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

const seedIfEmpty = async (Model, docs) => {
  const count = await Model.countDocuments();
  if (count > 0) {
    return;
  }
  await Model.insertMany(docs);
};

export const seedDedicatedPurchasesPages = async () => {
  await seedIfEmpty(Supplier, [
    {
      companyName: 'TechDistro India Pvt Ltd',
      phone: '9876543210',
      gstNumber: '27AABCT3518Q1ZV',
      businessAddress: 'Mumbai, MH',
      supplierCategory: 'Electronics'
    },
    {
      companyName: 'Office Essentials Corp',
      phone: '9988776655',
      gstNumber: '07AACCO1122F1ZX',
      businessAddress: 'Delhi, DL',
      supplierCategory: 'Office Supplies'
    },
    {
      companyName: 'Global Logistix',
      phone: '8877665544',
      gstNumber: '33AABCG9988L1ZA',
      businessAddress: 'Chennai, TN',
      supplierCategory: 'General Goods'
    }
  ]);

  const suppliers = await Supplier.find({}).lean();
  const supplierByName = new Map(suppliers.map((supplier) => [supplier.companyName, supplier]));

  await seedIfEmpty(PurchaseOrder, [
    {
      supplierId: supplierByName.get('TechDistro India Pvt Ltd')?._id,
      supplierName: 'TechDistro India Pvt Ltd',
      items: [{ name: 'Wireless Ergonomic Mouse', quantity: 50, costPrice: 800, gst: 18 }],
      subtotal: 40000,
      tax: 7200,
      total: 47200,
      date: '2023-10-10T00:00:00.000Z'
    },
    {
      supplierId: supplierByName.get('Office Essentials Corp')?._id,
      supplierName: 'Office Essentials Corp',
      items: [{ name: 'A4 Paper Ream (500 Sheets)', quantity: 200, costPrice: 180, gst: 12 }],
      subtotal: 36000,
      tax: 4320,
      total: 40320,
      date: '2023-10-15T00:00:00.000Z'
    }
  ]);

};
