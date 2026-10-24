
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000/api/workforce";
const EMP_API = "http://localhost:5000/api/employees";

type Employee = { _id: string; name: string; employeeId: string };
type Leave = {
  _id: string;
  employeeId: Employee;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

export default function WorkforcePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [e, a, l] = await Promise.all([
        fetch(EMP_API), fetch(`${API}/attendance`), fetch(`${API}/leaves`)
      ]);
      if (!e.ok || !a.ok || !l.ok) throw new Error("Could not load data");
      const es = await e.json();
      setEmployees(es);
      setAttendance(await a.json());
      setLeaves(await l.json());
      if (!employeeId && es.length) setEmployeeId(es[0]._id);
    } catch {
      setMessage("Backend error: ensure the server is running.");
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("hcm_token")) {
      router.replace("/");
      return;
    }
    load();
  }, [router]);

  async function attendanceAction(action: string) {
    setMessage("");
    try {
      const response = await fetch(`${API}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, action })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function createLeave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, type, startDate, endDate, reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage("Leave request submitted.");
      setStartDate(""); setEndDate(""); setReason("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function decideLeave(id: string, status: string) {
    try {
      const response = await fetch(`${API}/leaves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(`Leave ${status.toLowerCase()}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-800 md:p-10">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => router.push("/dashboard")} className="mb-5 rounded-lg border bg-white px-4 py-2">
          ← Dashboard
        </button>
        <h1 className="mb-2 text-3xl font-bold">Attendance & Leave</h1>
        <p className="mb-6 text-slate-500">Track daily attendance and manage leave requests.</p>

        {message && <p role="status" className="mb-5 rounded-lg border bg-white p-4">{message}</p>}

        <section className="mb-7 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Mark Attendance</h2>
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mb-4 w-full rounded-lg border p-3">
            {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
          </select>
          <div className="flex flex-wrap gap-3">
            <button disabled={!employeeId} onClick={() => attendanceAction("checkin")} className="rounded-lg bg-blue-700 px-5 py-3 text-white disabled:opacity-50">Check In</button>
            <button disabled={!employeeId} onClick={() => attendanceAction("checkout")} className="rounded-lg bg-slate-800 px-5 py-3 text-white disabled:opacity-50">Check Out</button>
          </div>
        </section>

        <section className="mb-7 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Attendance Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead><tr className="border-b text-slate-500"><th className="p-3">Employee</th><th className="p-3">Date</th><th className="p-3">Check In</th><th className="p-3">Check Out</th><th className="p-3">Status</th></tr></thead>
              <tbody>{attendance.map(a => <tr key={a._id} className="border-b"><td className="p-3">{a.employeeId?.name}</td><td className="p-3">{a.date}</td><td className="p-3">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "—"}</td><td className="p-3">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "—"}</td><td className="p-3">{a.status}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <form onSubmit={createLeave} className="mb-7 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Request Leave</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Leave Type
              <select value={type} onChange={e => setType(e.target.value)} className="mt-2 w-full rounded-lg border p-3">
                <option>Annual</option><option>Sick</option><option>Casual</option><option>Unpaid</option>
              </select>
            </label>
            <label className="text-sm">Employee
              <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mt-2 w-full rounded-lg border p-3">
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </label>
            <label className="text-sm">Start Date<input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-2 w-full rounded-lg border p-3" /></label>
            <label className="text-sm">End Date<input required min={startDate || undefined} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-2 w-full rounded-lg border p-3" /></label>
            <label className="text-sm sm:col-span-2">Reason<textarea value={reason} onChange={e => setReason(e.target.value)} className="mt-2 w-full rounded-lg border p-3" rows={2} /></label>
          </div>
          <button disabled={!employeeId} className="mt-4 rounded-lg bg-blue-700 px-5 py-3 text-white disabled:opacity-50">Submit Leave Request</button>
        </form>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Leave Requests</h2>
          <div className="space-y-4">
            {leaves.map(l => <div key={l._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div><p className="font-semibold">{l.employeeId?.name || "Employee"} · {l.type}</p><p className="text-sm text-slate-500">{l.startDate} to {l.endDate} · {l.reason}</p><p className="mt-1 text-sm">Status: {l.status}</p></div>
              {l.status === "Pending" && <div className="flex gap-2"><button onClick={() => decideLeave(l._id, "Approved")} className="rounded bg-green-50 px-3 py-2 text-green-700">Approve</button><button onClick={() => decideLeave(l._id, "Rejected")} className="rounded bg-red-50 px-3 py-2 text-red-700">Reject</button></div>}
            </div>)}
            {!leaves.length && <p className="text-slate-500">No leave requests yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
