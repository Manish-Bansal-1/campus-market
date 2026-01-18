const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ======================
   REGISTER
====================== */
router.post("/register", async (req, res) => {
  try {
    const { name, username, password, year, gender, college, otherCollegeName } =
      req.body;

    if (!name || !username || !password) {
      return res
        .status(400)
        .json({ message: "Name, username & password required" });
    }

    // ✅ College required
    if (!college) {
      return res.status(400).json({ message: "College is required" });
    }

    const allowedColleges = [
      "JECRC Foundation",
      "JECRC University",
      "Poornima College",
      "Poornima University",
      "SKIT Jaipur",
      "Other",
    ];

    if (!allowedColleges.includes(college)) {
      return res.status(400).json({ message: "Invalid college selected" });
    }

    // ✅ If Other -> manual name required
    let cleanOtherCollegeName = "";
    if (college === "Other") {
      cleanOtherCollegeName = (otherCollegeName || "").trim();

      if (!cleanOtherCollegeName) {
        return res
          .status(400)
          .json({ message: "Please enter your college name" });
      }

      if (cleanOtherCollegeName.length < 2) {
        return res
          .status(400)
          .json({ message: "College name too short" });
      }

      if (cleanOtherCollegeName.length > 80) {
        return res
          .status(400)
          .json({ message: "College name too long" });
      }
    }

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.includes(" ")) {
      return res.status(400).json({ message: "Username cannot contain spaces" });
    }

    const exists = await User.findOne({ username: cleanUsername });
    if (exists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // ✅ Optional safe values
    const safeYear = ["1st", "2nd", "3rd", "4th"].includes(year) ? year : "";
    const safeGender = ["male", "female", "not_preferred"].includes(gender)
      ? gender
      : "";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: cleanName,
      username: cleanUsername,
      password: hashedPassword,
      year: safeYear,
      gender: safeGender,

      // ✅ NEW
      college,
      otherCollegeName: college === "Other" ? cleanOtherCollegeName : "",
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    // Duplicate key error safety
    if (err.code === 11000) {
      return res.status(400).json({ message: "Username already taken" });
    }

    res.status(500).json({ error: err.message });
  }
});

/* ======================
   LOGIN
====================== */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username & password required" });
    }

    const cleanUsername = username.trim().toLowerCase();

    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        year: user.year || "",
        gender: user.gender || "",

        // ✅ NEW
        college: user.college || "",
        otherCollegeName: user.otherCollegeName || "",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
