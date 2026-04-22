import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

console.log("🔥 FIREBASE ENV CHECK");
console.log("PROJECT ID:", process.env.FIREBASE_PROJECT_ID);
console.log("CLIENT EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("PRIVATE KEY EXISTS:", !!process.env.FIREBASE_PRIVATE_KEY);

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
    });

    console.log("✅ FIREBASE INIT SUCCESS");
  }
} catch (error) {
  console.log("❌ FIREBASE INIT FAILED");
  console.error(error);
}

export default admin;
