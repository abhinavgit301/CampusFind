import mongoose from 'mongoose';
import dns from 'node:dns';
import { ENV } from './env.js';

// Ensure reliable DNS resolution for MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_e) {}

let mongodInstance: any = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = ENV.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Connecting to MongoDB Atlas / configured URI...`);
      const conn = await mongoose.connect(uri);
      console.log(`[Database] Connected successfully to Atlas host: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`[Database] Failed to connect to configured MONGODB_URI:`, err);
      if (ENV.NODE_ENV === 'production') {
        throw err;
      }
      console.log(`[Database] Falling back to in-memory MongoDB for local development...`);
    }
  }

  // Fallback to in-memory MongoDB in development
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    console.log(`[Database] Initialized In-Memory MongoDB at: ${memoryUri}`);
    const conn = await mongoose.connect(memoryUri);
    console.log(`[Database] In-memory MongoDB connected successfully!`);
    return conn;
  } catch (err) {
    console.error(`[Database] Could not start in-memory MongoDB:`, err);
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}
