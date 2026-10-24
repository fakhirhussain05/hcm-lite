
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    department: { type: String, default: "General" },
    designation: { type: String, default: "Employee" },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
