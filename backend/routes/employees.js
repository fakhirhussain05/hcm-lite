
const express = require("express");
const mongoose = require("mongoose");
const Employee = require("../models/employee");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch {
    res.status(500).json({ message: "Could not fetch employees" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { employeeId, name, email } = req.body;
    if (!employeeId?.trim() || !name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "Employee ID, name and email are required" });
    }
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      message: error.code === 11000 ? "Employee ID or email already exists" : "Invalid employee data"
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch {
    res.status(400).json({ message: "Could not update employee" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch {
    res.status(500).json({ message: "Could not delete employee" });
  }
});

module.exports = router;
