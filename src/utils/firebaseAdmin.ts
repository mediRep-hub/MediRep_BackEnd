import admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  console.log("🔑 Private key starts with:", privateKey.substring(0, 40));

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });

  console.log("✅ Firebase Admin initialized");
}

export default admin;
