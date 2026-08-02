const dotenv = require("dotenv");

const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminName || !adminEmail || !adminPassword) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env"
      );
    }

    if (adminPassword.length < 8) {
      throw new Error(
        "ADMIN_PASSWORD must contain at least 8 characters"
      );
    }

    const normalisedEmail = adminEmail.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalisedEmail,
    });

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log("Admin already exists");
        process.exit(0);
      }

      existingUser.role = "admin";
      existingUser.isActive = true;
      existingUser.password = adminPassword;
      existingUser.name = adminName.trim();

      await existingUser.save();

      console.log("Existing user was converted to admin");
      process.exit(0);
    }

    const admin = await User.create({
      name: adminName.trim(),
      email: normalisedEmail,
      password: adminPassword,
      role: "admin",
      isActive: true,
    });

    console.log(`Admin created successfully: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error(`Admin creation failed: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();