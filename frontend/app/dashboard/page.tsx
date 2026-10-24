
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  name: string;
  email: string;
  role: string;
};

type Stats = {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  monthlyPayroll: number;
};

const API = "http://localhost:5000";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("hcm_token");
    const savedUser = localStorage.getItem("hcm_user");

    if (!token || !savedUser) {
      router.replace("/");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem("hcm_token");
      localStorage.removeItem("hcm_user");
      router.replace("/");
      return;
    }

    async function loadStats() {
      try {
        const [employeesResponse, reportsResponse, payrollResponse] =
          await Promise.all([
            fetch(`${API}/api/employees`),
            fetch(`${API}/api/reports`),
            fetch(`${API}/api/payroll`),
          ]);

        if (
          !employeesResponse.ok ||
          !reportsResponse.ok ||
          !payrollResponse.ok
        ) {
          throw new Error("Could not load dashboard statistics.");
        }

        const employees = await employeesResponse.json();
        const reports = await reportsResponse.json();
        const payroll = await payrollResponse.json();

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const monthlyPayroll = payroll
          .filter(
            (record: { month: number; year: number }) =>
              Number(record.month) === currentMonth &&
              Number(record.year) === currentYear
          )
          .reduce(
            (total: number, record: { netSalary: number }) =>
              total + Number(record.netSalary || 0),
            0
          );

        setStats({
          totalEmployees: employees.length,
          presentToday: Number(reports.presentToday || 0),
          pendingLeaves: Number(reports.pendingLeaves || 0),
          monthlyPayroll,
        });
      } catch (error) {
        setStatsError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard statistics."
        );
      }
    }

    loadStats();
  }, [router]);

  function logout() {
    localStorage.removeItem("hcm_token");
    localStorage.removeItem("hcm_user");
    router.replace("/");
  }

  const statCards = [
    {
      title: "Total Employees",
      value: stats?.totalEmployees,
      icon: "👥",
      color: "text-blue-700",
    },
    {
      title: "Present Today",
      value: stats?.presentToday,
      icon: "✅",
      color: "text-emerald-700",
    },
    {
      title: "Pending Leaves",
      value: stats?.pendingLeaves,
      icon: "📅",
      color: "text-amber-700",
    },
    {
      title: "Monthly Payroll",
      value: stats?.monthlyPayroll,
      icon: "💰",
      color: "text-violet-700",
      money: true,
    },
  ];

  if (!user) {
    return <main className="p-8">Loading dashboard...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="flex items-center justify-between bg-white px-6 py-5 shadow-sm md:px-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">HCM Lite</h1>
          <p className="text-sm text-slate-500">
            Human Capital Management System
          </p>
        </div>

        <button
          onClick={logout}
          className="rounded-lg bg-red-50 px-4 py-2 font-medium text-red-600 hover:bg-red-100"
        >
          Logout
        </button>
      </header>

      <section className="mx-auto max-w-7xl p-6 md:p-10">
        <p className="text-sm text-slate-500">{user.role} Portal</p>

        <h2 className="mt-1 text-3xl font-bold">
          Welcome, {user.name}!
        </h2>

        <p className="mt-2 text-slate-600">
          Manage your workforce from one place.
        </p>

        {statsError && (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {statsError}
          </p>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-500">{item.title}</p>
                <span className="text-2xl">{item.icon}</span>
              </div>

              <p className={`mt-4 text-3xl font-bold ${item.color}`}>
                {stats === null
                  ? "Loading..."
                  : item.money
                    ? new Intl.NumberFormat("en-PK", {
                        style: "currency",
                        currency: "PKR",
                        maximumFractionDigits: 0,
                      }).format(item.value || 0)
                    : item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold">Quick Access</h3>
          <p className="mt-2 text-slate-500">
            Access your workforce management modules.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/dashboard/employees")}
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Manage Employees →
            </button>

            <button
              onClick={() => router.push("/dashboard/workforce")}
              className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
            >
              Attendance &amp; Leave →
            </button>

            <button
              onClick={() => router.push("/dashboard/payroll")}
              className="rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800"
            >
              Payroll →
            </button>

            <button
              onClick={() => router.push("/dashboard/reports")}
              className="rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-900"
            >
              Reports →
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Employees",
                description: "Add, search, edit and delete employee records.",
                path: "/dashboard/employees",
              },
              {
                title: "Attendance",
                description: "Manage daily employee attendance.",
                path: "/dashboard/workforce",
              },
              {
                title: "Leave Management",
                description: "Manage employee leave requests.",
                path: "/dashboard/workforce",
              },
              {
                title: "Payroll",
                description: "Generate salaries and track payments.",
                path: "/dashboard/payroll",
              },
              {
                title: "Reports",
                description: "View employee and attendance summaries.",
                path: "/dashboard/reports",
              },
              {
                title: "Settings",
                description: "Settings module setup in progress.",
                path: "",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 p-5"
              >
                <h4 className="font-semibold">{item.title}</h4>
                <p className="mt-2 text-sm text-slate-500">
                  {item.description}
                </p>

                {item.path && (
                  <button
                    onClick={() => router.push(item.path)}
                    className="mt-4 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Open module →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Signed in as {user.email} · Role: {user.role}
        </p>
      </section>
    </main>
  );
}
