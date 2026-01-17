const webpush = require("web-push");
const User = require("../models/User");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:test@campusmarks.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushToUser(userId, payloadObj) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ PUSH: user not found", userId);
      return false;
    }

    const sub = user.pushSubscription;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      console.log("⚠️ PUSH: no subscription saved for user", userId);
      return false;
    }

    const payload = JSON.stringify(payloadObj);

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      },
      payload
    );

    console.log("✅ PUSH SENT to user:", userId);
    return true;
  } catch (err) {
    console.log("❌ PUSH SEND ERROR:", err.message);

    // 🔥 if subscription expired / invalid -> remove it
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log("🧹 Removing expired subscription for user:", userId);
      await User.findByIdAndUpdate(userId, { pushSubscription: null });
    }

    return false;
  }
}

module.exports = { sendPushToUser };
