
const mongoose = require("mongoose");

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log("MongoDB connected successfully!");
  console.log("Connected database:", mongoose.connection.name);
}

module.exports = connectDB;
