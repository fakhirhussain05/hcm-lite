
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: String, required: true },
  checkIn: { type: Date, default: null },
  checkOut: { type: Date, default: null },
  status: { type: String, enum: ["Present", "Late"], default: "Present" }
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, enum: ["Annual", "Sick", "Casual", "Unpaid"], required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, default: "" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
}, { timestamps: true });

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
const Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema);
const Employee = require("../models/employee");

router.get("/attendance", async (req, res) => {
  try {
    const records = await Attendance.find().populate("employeeId", "name employeeId").sort({ date: -1 });
    res.json(records);
  } catch {
    res.status(500).json({ message: "Could not load attendance" });
  }
});

router.post("/attendance", async (req, res) => {
  try {
    const { employeeId, action } = req.body;
    if (!mongoose.isValidObjectId(employeeId) || !["checkin", "checkout"].includes(action)) {
      return res.status(400).json({ message: "Select an employee and valid attendance action" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee || employee.status !== "Active") {
      return res.status(404).json({ message: "Active employee not found" });
    }

    const now = new Date();
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);

    let record = await Attendance.findOne({ employeeId, date });

    if (action === "checkin") {
      if (record) return res.status(409).json({ message: "Attendance already marked today" });
      const localTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: false
      }).format(now);
      record = await Attendance.create({
        employeeId, date, checkIn: now,
        status: localTime > "09:15" ? "Late" : "Present"
      });
    } else {
      if (!record) return res.status(404).json({ message: "Check in before checking out" });
      if (record.checkOut) return res.status(409).json({ message: "Already checked out today" });
      record.checkOut = now;
      await record.save();
    }

    res.json({ message: action === "checkin" ? "Check-in successful" : "Check-out successful", record });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      message: error.code === 11000 ? "Attendance already exists today" : "Attendance operation failed"
    });
  }
});

router.get("/leaves", async (req, res) => {
  try {
    const records = await Leave.find().populate("employeeId", "name employeeId").sort({ createdAt: -1 });
    res.json(records);
  } catch {
    res.status(500).json({ message: "Could not load leave requests" });
  }
});

router.post("/leaves", async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;
    if (!mongoose.isValidObjectId(employeeId) ||
        !["Annual", "Sick", "Casual", "Unpaid"].includes(type) ||
        !startDate || !endDate || startDate > endDate) {
      return res.status(400).json({ message: "Please enter valid leave details" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee || employee.status !== "Active") {
      return res.status(404).json({ message: "Active employee not found" });
    }

    const overlap = await Leave.findOne({
      employeeId,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    if (overlap) return res.status(409).json({ message: "This leave overlaps an existing request" });

    const leave = await Leave.create({ employeeId, type, startDate, endDate, reason });
    res.status(201).json(leave);
  } catch {
    res.status(400).json({ message: "Could not create leave request" });
  }
});

router.patch("/leaves/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) ||
        !["Approved", "Rejected"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid leave decision" });
    }
    const leave = await Leave.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true, runValidators: true }
    );
    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    res.json(leave);
  } catch {
    res.status(400).json({ message: "Could not update leave request" });
  }
});

module.exports = router;
