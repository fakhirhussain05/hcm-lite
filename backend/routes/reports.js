
const express = require("express");
const mongoose = require("mongoose");
const Employee = require("../models/employee");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const Attendance = mongoose.models.Attendance;
    const Leave = mongoose.models.Leave;

    const [
      totalEmployees,
      activeEmployees,
      attendanceToday,
      pendingLeaves,
      approvedLeaves
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: "Active" }),
      Attendance ? Attendance.find({ date: today })
        .populate("employeeId", "name employeeId") : [],
      Leave ? Leave.countDocuments({ status: "Pending" }) : 0,
      Leave ? Leave.countDocuments({ status: "Approved" }) : 0
    ]);

    res.json({
      date: today,
      totalEmployees,
      activeEmployees,
      presentToday: attendanceToday.length,
      attendanceToday,
      pendingLeaves,
      approvedLeaves
    });
  } catch (error) {
    res.status(500).json({ message: "Could not generate reports" });
  }
});

module.exports = router;
