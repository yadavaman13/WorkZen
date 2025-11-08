// src/components/pages/Dashboard.jsx
import DashboardLayout from "../components/layout/DashboardLayout.jsx";

import {
  kpis,
  employees,
  onboarding_processes,
  onboarding_steps,
  documents,
  notifications,
  departments,
  roles,
} from "../data/hrms.js";

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
          {sub && <div className="text-xs text-gray-400">{sub}</div>}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-50">
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-50 text-green-700 border border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

const statusTone = (s) => ({
  initiated: "blue",
  in_progress: "yellow",
  under_review: "yellow",
  approved: "green",
  rejected: "red",
  pending: "yellow",
  verified: "green",
}[s] || "gray");

export default function Dashboard() {
  const latestOnboarding = onboarding_processes
    .map((p) => {
      const emp = employees.find((e) => e.employee_id === p.employee_id);
      return { ...p, employee_name: `${emp?.first_name} ${emp?.last_name}` };
    })
    .slice(0, 5);

  const pendingDocs = documents.filter((d) => d.verification_status === "pending").slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, Admin!</h1>
            <p className="text-sm text-gray-500 mt-1">Here is what is happening with your employee onboarding</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Today</button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">This Week</button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">This Month</button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm">All Time</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard label="Total Sessions" value={kpis.totalEmployees} icon="📅" />
        <StatCard label="Upcoming" value={kpis.pendingVerifications} icon="🕐" />
        <StatCard label="Earnings" value="Coming Soon" sub="Feature under development" icon="💰" />
        <StatCard label="Average Rating" value="N/A" icon="⭐" />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50"><span className="text-xl">✏️</span></div>
            <span className="text-sm font-medium text-gray-900">Update Availability</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50"><span className="text-xl">👁️</span></div>
            <span className="text-sm font-medium text-gray-900">View Profile</span>
          </button>
          <button className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50"><span className="text-xl">💬</span></div>
            <span className="text-sm font-medium text-gray-900">Get Support</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-6">
          <div className="rounded-xl bg-white shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Active Onboarding</h2>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned HR</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Started</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestOnboarding.map((row) => {
                    const hr = employees.find((e) => e.employee_id === row.assigned_hr_id);
                    return (
                      <tr key={row.onboarding_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">{row.employee_name}</div>
                          <div className="text-xs text-gray-500">ID #{row.onboarding_id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <Pill tone={statusTone(row.onboarding_status)}>{row.onboarding_status.replace(/_/g, ' ')}</Pill>
                        </td>
                        <td className="px-5 py-4 text-gray-700">{hr ? `${hr.first_name} ${hr.last_name}` : "-"}</td>
                        <td className="px-5 py-4 text-gray-600">{row.start_date}</td>
                        <td className="px-5 py-4 text-right">
                          <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors">Open</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
              Pending steps: <span className="font-medium text-gray-900">{onboarding_steps.filter((s) => s.step_status === "pending").length}</span> • Completed steps: <span className="font-medium text-gray-900">{onboarding_steps.filter((s) => s.step_status === "completed").length}</span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-xl bg-white shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Mark all read</button>
            </div>
            <ul className="divide-y divide-gray-100">
              {recentNotifications.map((n) => {
                const emp = employees.find((e) => e.employee_id === n.employee_id);
                return (
                  <li key={n.notification_id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 leading-snug">{n.message}</div>
                        <div className="text-xs text-gray-500 mt-1.5">For: {emp?.first_name} {emp?.last_name} • {new Date(n.created_at).toLocaleTimeString()}</div>
                      </div>
                      {n.status === "sent" && <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Department Mix</h3>
            <ul className="space-y-3 text-sm">
              {departments.map((d) => {
                const count = employees.filter((e) => e.department_id === d.department_id).length;
                return (
                  <li key={d.department_id} className="flex items-center gap-3">
                    <div className="w-24 text-gray-700 font-medium text-xs">{d.department_name}</div>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{width: `${(count / Math.max(1, employees.length)) * 100}%`}}></div>
                    </div>
                    <div className="w-8 text-right text-xs font-semibold text-gray-900">{count}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}