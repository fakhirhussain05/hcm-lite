
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/user");

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");
    console.log("Database:", mongoose.connection.name);

    const users = await User.find({})
      .select("name email role isActive")
      .lean();

    if (users.length === 0) {
      console.log("No users found in this database.");
      return;
    }

    console.log("\nUsers found:", users.length);

    for (const user of users) {
      console.log({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    }

    const admins = users.filter((user) => user.role === "Admin");

    console.log("\nAdmin accounts found:", admins.length);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
