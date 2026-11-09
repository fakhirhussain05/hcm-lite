
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("hcm_token");

    if (!token) {
      router.replace("/");
      return;
    }

    fetch("/api/reports", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load report");
        }

        setReport(data);
      })
      .catch((e) => setError(e.message));
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-800 md:p-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-5 text-blue-700"
        >
          ← Dashboard
        </button>

        <h1 className="text-3xl font-bold">Reports & Analytics</h1>

        <p className="mt-2 text-slate-500">
          Workforce overview for {report?.date || "today"}.
        </p>

        {error && <p className="mt-5 text-red-600">{error}</p>}

        {!report && !error && (
          <p className="mt-5">Loading reports...</p>
        )}

        {report && (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Total Employees", report.totalEmployees],
                ["Active Employees", report.activeEmployees],
                ["Attendance Today", report.presentToday],
                ["Pending Leaves", report.pendingLeaves],
                ["Approved Leaves", report.approvedLeaves],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <p className="text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            <section className="mt-8 overflow-x-auto rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">
                Today's Attendance
              </h2>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Employee ID</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {report.attendanceToday.map((a: any) => (
                    <tr key={a._id} className="border-b">
                      <td className="p-3">
                        {a.employeeId?.name || "Employee"}
                      </td>
                      <td className="p-3">
                        {a.employeeId?.employeeId || "—"}
                      </td>
                      <td className="p-3">
                        {a.checkIn
                          ? new Date(a.checkIn).toLocaleTimeString()
                          : "—"}
                      </td>
                      <td className="p-3">
                        {a.checkOut
                          ? new Date(a.checkOut).toLocaleTimeString()
                          : "—"}
                      </td>
                      <td className="p-3">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {report.attendanceToday.length === 0 && (
                <p className="py-4 text-slate-500">
                  No attendance recorded today.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
