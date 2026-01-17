const webpush = require("web-push");
const User = require("../models/User");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushToUser = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user?.pushSubscription?.endpoint) return;

  try {
    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
  } catch (err) {
    console.log("❌ Push failed:", err.message);
  }
};

const sendPushToAllUsers = async (payload) => {
  const users = await User.find({ pushSubscription: { $ne: null } });

  for (const u of users) {
    try {
      await webpush.sendNotification(u.pushSubscription, JSON.stringify(payload));
    } catch (err) {
      console.log("❌ Push failed:", err.message);
    }
  }
};

module.exports = { sendPushToUser, sendPushToAllUsers };
