import mongoose from "mongoose";

let isConnected = false; // 🔒 global connection cache

const dbConnect = async (): Promise<void> => {
  if (isConnected) {
    // ✅ Use cached connection
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  const connectionString = process.env.MONGODB_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error(
      "MONGODB_CONNECTION_STRING is not defined in environment variables"
    );
  }

  try {
    mongoose.set("strictQuery", false);

    const conn = await mongoose.connect(connectionString, {
      dbName: "medi-rep",
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log("✅ MongoDB connected successfully to:", conn.connection.host);
  } catch (error: any) {
    console.error("❌ MongoDB connection error:", error.message);
    throw new Error("MongoDB connection failed");
  }
};

export default dbConnect;
