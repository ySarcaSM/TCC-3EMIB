const { MongoClient } = require('mongodb');

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('server');
  console.log('MongoDB conectado — database: server');

  // Indexes
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('user_data').createIndex({ username: 1, section: 1 }, { unique: true });

  return db;
}

function getDb() {
  if (!db) throw new Error('DB não conectado');
  return db;
}

module.exports = { connectDB, getDb };