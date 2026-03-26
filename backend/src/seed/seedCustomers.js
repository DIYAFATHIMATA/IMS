import Customer from '../models/Customer.js';

const defaultCustomers = [
  { name: 'Acme Corp', email: 'contact@acme.com', phone: '022-1234567', address: 'Business Bay, Pune' },
  { name: 'Rahul Sharma', email: 'rahul.s@gmail.com', phone: '9876500001', address: 'Indiranagar, Bangalore' },
  { name: 'Tech Solutions Ltd', email: 'procurement@techsol.com', phone: '080-4567890', address: 'Cyber City, Gurgaon' },
  { name: 'Priya Singh', email: 'priya.singh@design.studio', phone: '9900112233', address: 'Bandra, Mumbai' }
];

export const seedCustomers = async () => {
  const count = await Customer.countDocuments();
  if (count > 0) {
    return;
  }

  await Customer.insertMany(defaultCustomers);
};
