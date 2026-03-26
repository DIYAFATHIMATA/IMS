/**
 * MongoDB Migration Script (CommonJS)
 * Copies all data from local MongoDB (inventory_app) to Atlas Cluster0
 * Run with: node migrate.cjs
 */

const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/inventory_app';
const ATLAS_URI = 'mongodb+srv://inventory:diyafathima@cluster0.s0j9dkl.mongodb.net/?appName=Cluster0';
const DB_NAME = 'inventory_app';

async function migrate() {
  console.log('Starting MongoDB migration...');
  console.log('Local DB :', LOCAL_URI);
  console.log('Atlas DB :', 'cluster0.s0j9dkl.mongodb.net/' + DB_NAME);
  console.log('');

  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    await localClient.connect();
    console.log('[OK] Connected to local MongoDB');

    await atlasClient.connect();
    console.log('[OK] Connected to Atlas Cluster0');
    console.log('');

    const localDB = localClient.db(DB_NAME);
    const atlasDB = atlasClient.db(DB_NAME);

    const collections = await localDB.listCollections().toArray();
    console.log('Found ' + collections.length + ' collections in local DB');
    console.log('');

    if (collections.length === 0) {
      console.log('No collections found. Local DB may be empty.');
      return;
    }

    let totalDocs = 0;

    for (const collInfo of collections) {
      const name = collInfo.name;
      const localCol = localDB.collection(name);
      const docs = await localCol.find({}).toArray();

      if (docs.length === 0) {
        console.log('  SKIP  ' + name + ' (empty)');
        continue;
      }

      const atlasCol = atlasDB.collection(name);

      // Drop existing to avoid duplicates
      await atlasCol.drop().catch(() => {});

      await atlasCol.insertMany(docs);
      totalDocs += docs.length;
      console.log('  DONE  ' + name + ' -> ' + docs.length + ' documents');
    }

    console.log('');
    console.log('Migration complete! Total documents migrated: ' + totalDocs);

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
