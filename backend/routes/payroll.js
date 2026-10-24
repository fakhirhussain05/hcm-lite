
const express = require("express");
const mongoose = require("mongoose");
const Employee = require("../models/employee");

const router = express.Router();

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true, min: 0 },
  bonus: { type: Number, default: 0, min: 0 },
  deduction: { type: Number, default: 0, min: 0 },
  netSalary: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["Generated", "Paid"],
    default: "Generated"
  }
}, { timestamps: true });

payrollSchema.index(
  { employeeId: 1, month: 1, year: 1 },
  { unique: true }
);

const Payroll =
  mongoose.models.Payroll ||
  mongoose.model("Payroll", payrollSchema);

// View payroll records
router.get("/", async (req, res) => {
  try {
    const records = await Payroll.find()
      .populate("employeeId", "name employeeId department")
      .sort({ year: -1, month: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Could not load payroll records" });
  }
});

// Generate payroll for an employee
router.post("/", async (req, res) => {
  try {
    const { employeeId, month, year, bonus = 0, deduction = 0 } = req.body;

    if (
      !mongoose.isValidObjectId(employeeId) ||
      !Number.isInteger(Number(month)) ||
      Number(month) < 1 ||
      Number(month) > 12 ||
      !Number.isInteger(Number(year)) ||
      Number(year) < 2020 ||
      !Number.isFinite(Number(bonus)) ||
      !Number.isFinite(Number(deduction)) ||
      Number(bonus) < 0 ||
      Number(deduction) < 0
    ) {
      return res.status(400).json({ message: "Enter valid payroll details" });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee || employee.status !== "Active") {
      return res.status(404).json({ message: "Active employee not found" });
    }

    const basicSalary = Number(employee.salary || 0);
    const netSalary = basicSalary + Number(bonus) - Number(deduction);

    if (netSalary < 0) {
      return res.status(400).json({
        message: "Deduction cannot exceed salary plus bonus"
      });
    }

    const record = await Payroll.create({
      employeeId,
      month: Number(month),
      year: Number(year),
      basicSalary,
      bonus: Number(bonus),
      deduction: Number(deduction),
      netSalary
    });

    res.status(201).json(record);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Payroll already exists for this employee and month"
      });
    }

    res.status(500).json({ message: "Could not generate payroll" });
  }
});

// Mark payroll as paid
router.patch("/:id/pay", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid payroll record" });
    }

    const record = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: "Paid" },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Could not update payroll status" });
  }
});

module.exports = router;
