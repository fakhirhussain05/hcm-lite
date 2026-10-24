
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000";

type Employee = {
  _id: string;
  employeeId: string;
  name: string;
  salary: number;
  status: string;
};

type PayrollRecord = {
  _id: string;
  employeeId?: {
    _id: string;
    name: string;
    employeeId: string;
    department?: string;
  };
  month: number;
  year: number;
  basicSalary: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: "Generated" | "Paid";
};

export default function PayrollPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [bonus, setBonus] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const [employeeResponse, payrollResponse] = await Promise.all([
      fetch(`${API}/api/employees`),
      fetch(`${API}/api/payroll`),
    ]);

    if (!employeeResponse.ok || !payrollResponse.ok) {
      throw new Error("Could not load employees or payroll records.");
    }

    const employeeData = await employeeResponse.json();
    const payrollData = await payrollResponse.json();

    setEmployees(employeeData);
    setRecords(payrollData);
  }

  useEffect(() => {
    if (!localStorage.getItem("hcm_token")) {
      router.replace("/");
      return;
    }

    // Set current month and year after the component mounts.
    const now = new Date();
    setMonth(String(now.getMonth() + 1));
    setYear(String(now.getFullYear()));

    loadData()
      .catch((error) => {
        setMessage(
          error instanceof Error ? error.message : "Could not load data."
        );
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function generatePayroll(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!employeeId || !month || !year) {
      setMessage("Please select an employee, month and year.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API}/api/payroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          month: Number(month),
          year: Number(year),
          bonus: Number(bonus),
          deduction: Number(deduction),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate payroll.");
      }

      setMessage("Payroll generated successfully!");
      setBonus("0");
      setDeduction("0");
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function markPaid(id: string) {
    setMessage("");

    try {
      const response = await fetch(`${API}/api/payroll/${id}/pay`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update payment.");
      }

      setMessage("Payroll marked as paid.");
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update payment."
      );
    }
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-800 md:p-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-5 font-medium text-blue-700 hover:underline"
        >
          ← Dashboard
        </button>

        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="mt-2 text-slate-500">
          Generate and track employee salary records.
        </p>

        <form
          onSubmit={generatePayroll}
          className="mt-6 grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2"
        >
          <label className="text-sm font-medium">
            Employee
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            >
              <option value="">Select employee</option>
              {employees
                .filter((employee) => employee.status === "Active")
                .map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} — {employee.employeeId} (Salary:{" "}
                    {formatMoney(employee.salary || 0)})
                  </option>
                ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Month
            <select
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            >
              <option value="">Select month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {new Date(2000, i, 1).toLocaleString("en", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Year
            <input
              type="number"
              required
              min="2020"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Bonus (PKR)
            <input
              type="number"
              min="0"
              required
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            />
          </label>

          <label className="text-sm font-medium">
            Deduction (PKR)
            <input
              type="number"
              min="0"
              required
              value={deduction}
              onChange={(e) => setDeduction(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || loading}
            className="self-end rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Generating..." : "Generate Payroll"}
          </button>

          {message && (
            <p className="md:col-span-2 text-sm" role="status">
              {message}
            </p>
          )}
        </form>

        <div className="mt-8 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Payroll Records</h2>

          {loading ? (
            <p className="py-5 text-slate-500">Loading payroll records...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Basic Salary</th>
                  <th className="p-3">Bonus</th>
                  <th className="p-3">Deduction</th>
                  <th className="p-3">Net Salary</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record._id} className="border-b border-slate-100">
                    <td className="p-3">
                      {record.employeeId?.name || "Employee"}
                    </td>
                    <td className="p-3">
                      {record.month}/{record.year}
                    </td>
                    <td className="p-3">
                      {formatMoney(record.basicSalary)}
                    </td>
                    <td className="p-3">{formatMoney(record.bonus)}</td>
                    <td className="p-3">{formatMoney(record.deduction)}</td>
                    <td className="p-3 font-bold">
                      {formatMoney(record.netSalary)}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          record.status === "Paid"
                            ? "rounded-full bg-emerald-100 px-3 py-1 text-emerald-700"
                            : "rounded-full bg-amber-100 px-3 py-1 text-amber-700"
                        }
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {record.status !== "Paid" && (
                        <button
                          type="button"
                          onClick={() => markPaid(record._id)}
                          className="whitespace-nowrap rounded-lg bg-emerald-100 px-3 py-2 text-emerald-800 hover:bg-emerald-200"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && records.length === 0 && (
            <p className="py-5 text-slate-500">
              No payroll records yet. Generate your first payroll above.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
