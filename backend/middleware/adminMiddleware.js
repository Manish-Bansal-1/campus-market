const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    next();
  } catch (err) {
    console.error("ADMIN MIDDLEWARE ERROR:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
