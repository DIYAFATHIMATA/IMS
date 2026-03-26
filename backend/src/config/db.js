import mongoose from 'mongoose';

export const connectDB = async () => {
  const rawMongoURI = process.env.MONGODB_URI?.trim();

  if (!rawMongoURI) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  const hasNoDbName = /^mongodb(\+srv)?:\/\/[^/]+\/?$/.test(rawMongoURI);
  const mongoURI = hasNoDbName
    ? `${rawMongoURI.replace(/\/$/, '')}/inventory_app`
    : rawMongoURI;

  if (hasNoDbName) {
    console.log('No database name in MONGODB_URI. Using inventory_app');
  }

  await mongoose.connect(mongoURI);
  console.log('MongoDB connected successfully');
};
