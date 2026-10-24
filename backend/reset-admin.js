
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const User = require("./models/user");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = "qazifakhir6@gmail.com";

  const user = await User.findOne({ email }).select("+password");

    if (!user || user.role !== "Admin") {
      console.log("Admin account not found.");
      return;
    }

    rl.question("Enter a NEW password (12+ characters): ", async (password) => {
      try {
        if (password.length < 12) {
          console.log("Password must be at least 12 characters.");
          return;
        }

        const hash = await bcrypt.hash(password, 12);

        user.password = hash;
await user.save();

const savedUser = await User.findOne({ email }).select("+password");
const verified = await bcrypt.compare(password, savedUser.password);
console.log("Password hash verified:", verified);
console.log("Stored password hash exists:", Boolean(savedUser.password));

console.log(
  verified
    ? "Password saved and verified successfully!"
    : "Password verification failed."
);
      } catch (error) {
        console.log("Password reset failed:", error.message);
      } finally {
        rl.close();
        await mongoose.disconnect();
      }
    });
  } catch (error) {
    console.log("Error:", error.message);
    rl.close();
    await mongoose.disconnect();
  }
}

main();
