// utils/sendNotification.ts
import admin from "firebase-admin";

export const sendNotification = async (
  fcmToken: string | string[], // ← accept both
  title: string,
  body: string,
  data?: Record<string, string>,
) => {
  // Single token
  if (typeof fcmToken === "string") {
    const result = await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
      webpush: {
        notification: { title, body, icon: "/logo.png" },
      },
    });
    console.log("✅ FCM single result:", result);
    return result;
  }

  // Multiple tokens
  const result = await admin.messaging().sendEachForMulticast({
    tokens: fcmToken,
    notification: { title, body },
    data: data ?? {},
    webpush: {
      notification: { title, body, icon: "/logo.png" },
    },
  });

  console.log(
    "✅ FCM multicast result:",
    result.successCount,
    "sent,",
    result.failureCount,
    "failed",
  );

  // Log which tokens failed
  result.responses.forEach((resp, i) => {
    if (!resp.success) {
      console.error(`❌ Token[${i}] failed:`, fcmToken[i], resp.error?.message);
    }
  });

  return result;
};
