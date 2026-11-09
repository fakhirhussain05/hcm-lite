
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Connect to MongoDB
let dbConnection;

app.use(async (req, res, next) => {
  try {
    if (!dbConnection) {
      dbConnection = connectDB();
    }

    await dbConnection;
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "HCM Lite API is running!",
    status: "success",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    application: "HCM Lite",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/workforce", require("./routes/workforce"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/reports", require("./routes/reports"));

// Export for Vercel
module.exports = app;

// Start local server only
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `HCM Lite backend running at http://localhost:${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error("Backend startup failed:", error);
      process.exit(1);
    });
}
