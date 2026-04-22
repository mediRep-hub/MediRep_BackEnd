import admin from "../firebase";

export const sendNotification = async (
  fcmToken: string | string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) => {
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

  const result = await admin.messaging().sendEachForMulticast({
    tokens: fcmToken,
    notification: { title, body },
    data: data ?? {},
    webpush: {
      notification: { title, body, icon: "/logo.png" },
    },
  });

  console.log(
    "✅ FCM multicast:",
    result.successCount,
    "sent,",
    result.failureCount,
    "failed",
  );
  return result;
};
