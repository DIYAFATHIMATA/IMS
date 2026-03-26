/**
 * MongoDB Migration Script
 * Copies all data from local MongoDB (inventory_app) to Atlas Cluster0
 * Run with: node migrate.js
 */

import { MongoClient } from 'mongodb';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/inventory_app';
const ATLAS_URI = 'mongodb+srv://inventory:diyafathima@cluster0.s0j9dkl.mongodb.net/?appName=Cluster0';
const DB_NAME = 'inventory_app';

async function migrate() {
  console.log('🚀 Starting MongoDB migration...\n');

  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    // Connect to both
    await localClient.connect();
    console.log('✅ Connected to local MongoDB');

    await atlasClient.connect();
    console.log('✅ Connected to Atlas Cluster0\n');

    const localDB = localClient.db(DB_NAME);
    const atlasDB = atlasClient.db(DB_NAME);

    // Get all collections from local DB
    const collections = await localDB.listCollections().toArray();

    if (collections.length === 0) {
      console.log('⚠️  No collections found in local database.');
      return;
    }

    console.log(`📦 Found ${collections.length} collections to migrate:\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      // Get all documents from local collection
      const localCollection = localDB.collection(collectionName);
      const documents = await localCollection.find({}).toArray();

      if (documents.length === 0) {
        console.log(`   ⏭️  ${collectionName}: empty, skipping`);
        continue;
      }

      // Drop existing collection in Atlas (to avoid duplicates)
      const atlasCollection = atlasDB.collection(collectionName);
      await atlasCollection.drop().catch(() => {
        // Collection might not exist yet, that's fine
      });

      // Insert all documents into Atlas
      await atlasCollection.insertMany(documents);
      console.log(`   ✅ ${collectionName}: migrated ${documents.length} documents`);
    }

    console.log('\n🎉 Migration complete! All data is now in Atlas Cluster0.');
    console.log(`\n🔗 Your Atlas DB: https://cloud.mongodb.com`);

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    throw err;
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
