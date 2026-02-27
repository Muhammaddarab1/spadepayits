// Database connection helper using Mongoose
// - Supports an in-memory MongoDB (for local dev when Atlas SRV DNS fails)
// - Otherwise connects to the provided MONGO_URI (Atlas in production)
import mongoose from 'mongoose';

export const connectDB = async (mongoUri) => {
  try {
    if (mongoUri === 'memory') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      const uri = mem.getUri();
      const conn = await mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
      console.log('MongoDB Memory Server started');
      return conn;
    }
    const conn = await mongoose.connect(mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};
