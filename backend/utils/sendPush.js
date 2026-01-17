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

    if (!user || !user.pushSubscription?.endpoint) {
      return false;
    }

    const payload = JSON.stringify(payloadObj);

    await webpush.sendNotification(user.pushSubscription, payload);

    return true;
  } catch (err) {
    console.error("❌ PUSH SEND ERROR:", err.message);

    if (err.statusCode === 410 || err.statusCode === 404) {
      try {
        await User.findByIdAndUpdate(userId, { pushSubscription: null });
        console.log("🧹 Removed invalid push subscription for user:", userId);
      } catch (e) {
        console.log("❌ Failed to cleanup subscription:", e.message);
      }
    }

    return false;
  }
}

module.exports = { sendPushToUser };
