const { MongoClient } = require('mongodb');

let db;
let client;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'angler';

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log('[DB] Conectado ao MongoDB:', dbName);
  return db;
}

function getDb() {
  if (!db) throw new Error('MongoDB não conectado. Chame connectDB() primeiro.');
  return db;
}

async function closeDB() {
  if (client) await client.close();
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDb = getDb;
module.exports.closeDB = closeDB;
