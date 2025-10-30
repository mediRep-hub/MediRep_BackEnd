import mongoose from "mongoose";

// ✅ Global connection cache — Vercel reuses this between function invocations
let cached = (global as any).mongoose || { conn: null, promise: null };

const dbConnect = async (): Promise<void> => {
  if (cached.conn) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  const uri = process.env.MONGODB_CONNECTION_STRING;
  if (!uri) {
    throw new Error(
      "❌ MONGODB_CONNECTION_STRING is not defined in environment variables"
    );
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", false);

    cached.promise = mongoose
      .connect(uri, {
        dbName: "medi-rep",
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log(
          "✅ MongoDB connected successfully:",
          mongooseInstance.connection.host
        );
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
};

export default dbConnect;
