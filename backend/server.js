
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({ message: "HCM Lite API is running!", status: "success" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    application: "HCM Lite",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", require("./routes/auth"));

// Employee Management API
app.use("/api/employees", require("./routes/employees"));
app.use("/api/workforce", require("./routes/workforce"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/reports", require("./routes/reports"));


async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`HCM Lite backend running at http://localhost:${PORT}`);
  });
}

startServer();
