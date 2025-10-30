import mongoose from "mongoose";

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error("❌ Missing MONGODB_URI in environment variables");
  }

  try {
    await mongoose.connect(mongoURI, {
      dbName: process.env.DB_NAME || "default_db",
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};

export default dbConnect;
