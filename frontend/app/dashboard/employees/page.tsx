
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000/api/employees";

type Employee = {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  salary?: number;
  status?: string;
};

const emptyForm = {
  employeeId: "",
  name: "",
  email: "",
  phone: "",
  department: "General",
  designation: "Employee",
  salary: "0",
  status: "Active",
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadEmployees() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error();
      setEmployees(await response.json());
    } catch {
      setMessage("Could not load employees. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("hcm_token")) {
      router.replace("/");
      return;
    }
    loadEmployees();
  }, [router]);

  function changeField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function editEmployee(employee: Employee) {
    setEditing(employee._id);
    setForm({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      department: employee.department || "General",
      designation: employee.designation || "Employee",
      salary: String(employee.salary ?? 0),
      status: employee.status || "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(editing ? `${API}/${editing}` : API, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, salary: Number(form.salary) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save employee");

      setMessage(editing ? "Employee updated successfully!" : "Employee added successfully!");
      setForm(emptyForm);
      setEditing(null);
      await loadEmployees();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  async function deleteEmployee(id: string) {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");
      setMessage("Employee deleted successfully!");
      await loadEmployees();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed");
    }
  }

  const filtered = employees.filter((employee) =>
    [employee.name, employee.email, employee.employeeId, employee.department]
      .some((value) => value?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-800 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-blue-700">HCM Lite / Admin Portal</p>
            <h1 className="mt-2 text-3xl font-bold">Employee Management</h1>
            <p className="mt-2 text-slate-500">Add and manage your workforce.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border bg-white px-4 py-2 hover:bg-slate-50"
          >
            ← Dashboard
          </button>
        </div>

        {message && (
          <div className="mb-5 rounded-lg border bg-white p-4 text-sm" role="status">
            {message}
          </div>
        )}

        <form onSubmit={saveEmployee} className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">
            {editing ? "Edit Employee" : "Add New Employee"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["employeeId", "Employee ID", "EMP-001"],
              ["name", "Full Name", "Employee full name"],
              ["email", "Email", "employee@example.com"],
              ["phone", "Phone", "Phone number"],
              ["department", "Department", "Department"],
              ["designation", "Designation", "Job title"],
              ["salary", "Monthly Salary", "50000"],
            ].map(([name, label, placeholder]) => (
              <label key={name} className="text-sm font-medium">
                {label}
                <input
                  required={["employeeId", "name", "email"].includes(name)}
                  type={name === "email" ? "email" : name === "salary" ? "number" : "text"}
                  min={name === "salary" ? "0" : undefined}
                  step={name === "salary" ? "0.01" : undefined}
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={changeField}
                  placeholder={placeholder}
                  className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal outline-none focus:border-blue-500"
                />
              </label>
            ))}

            <label className="text-sm font-medium">
              Status
              <select
                name="status"
                value={form.status}
                onChange={changeField}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
              {editing ? "Update Employee" : "Add Employee"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(null); setForm(emptyForm); }}
                className="rounded-lg border px-5 py-3"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold">
              Employees ({filtered.length})
            </h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full rounded-lg border p-3 sm:w-72"
            />
          </div>

          {loading ? (
            <p>Loading employees...</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["ID", "Employee", "Department", "Designation", "Salary", "Status", "Actions"].map((heading) => (
                      <th key={heading} className="p-3">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((employee) => (
                    <tr key={employee._id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{employee.employeeId}</td>
                      <td className="p-3">
                        <div className="font-semibold">{employee.name}</div>
                        <div className="text-slate-500">{employee.email}</div>
                      </td>
                      <td className="p-3">{employee.department}</td>
                      <td className="p-3">{employee.designation}</td>
                      <td className="p-3">{Number(employee.salary || 0).toLocaleString()}</td>
                      <td className="p-3">{employee.status}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button onClick={() => editEmployee(employee)} className="rounded bg-blue-50 px-3 py-2 text-blue-700">Edit</button>
                          <button onClick={() => deleteEmployee(employee._id)} className="rounded bg-red-50 px-3 py-2 text-red-700">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
