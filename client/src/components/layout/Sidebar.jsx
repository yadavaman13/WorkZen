// src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

const navItem =
  "group flex items-center gap-3 pr-4 py-3 transition-all duration-200 text-sm font-medium active:scale-[0.98] active:opacity-80";

export default function Sidebar() {
  return (
    <aside className="h-screen w-56 border-r border-gray-200 bg-white hidden md:flex md:flex-col md:sticky md:top-0">
      {/* Logo Section */}
      <div className="px-6 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#A24689" }}
          >
            <span className="text-white font-bold text-base">W</span>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900 leading-tight">
              WorkZen
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-tight">
              HRMS
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5">
        <NavLink
          to="/dashboard/employees"
          className={({ isActive }) =>
            `${navItem} pl-6 ${
              isActive
                ? "text-gray-900 bg-gray-100 border-l-4"
                : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
            }`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  borderLeftColor: "#A24689",
                  paddingLeft: "calc(1.5rem - 4px)",
                }
              : {}
          }
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="flex-1">Employees</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NavLink>
        <NavLink
          to="/dashboard/attendance"
          className={({ isActive }) =>
            `${navItem} pl-6 ${
              isActive
                ? "text-gray-900 bg-gray-100 border-l-4"
                : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
            }`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  borderLeftColor: "#A24689",
                  paddingLeft: "calc(1.5rem - 4px)",
                }
              : {}
          }
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span className="flex-1">Attendance</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NavLink>
        <NavLink
          to="/dashboard/timeoff"
          className={({ isActive }) =>
            `${navItem} pl-6 ${
              isActive
                ? "text-gray-900 bg-gray-100 border-l-4"
                : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
            }`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  borderLeftColor: "#A24689",
                  paddingLeft: "calc(1.5rem - 4px)",
                }
              : {}
          }
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 23"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="flex-1">Time Off</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NavLink>
        <NavLink
          to="/dashboard/payroll"
          className={({ isActive }) =>
            `${navItem} pl-6 ${
              isActive
                ? "text-gray-900 bg-gray-100 border-l-4"
                : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
            }`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  borderLeftColor: "#A24689",
                  paddingLeft: "calc(1.5rem - 4px)",
                }
              : {}
          }
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="flex-1">Payroll</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NavLink>
        <NavLink
          to="/dashboard/reports"
          className={({ isActive }) =>
            `${navItem} pl-6 ${
              isActive
                ? "text-gray-900 bg-gray-100 border-l-4"
                : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
            }`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  borderLeftColor: "#A24689",
                  paddingLeft: "calc(1.5rem - 4px)",
                }
              : {}
          }
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="flex-1">Reports</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NavLink>

        <div className="pt-5 pb-2">
          <div className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Settings
          </div>
        </div>

        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            `${navItem} pl-6 ${
              isActive
                ? "text-gray-900 bg-gray-100 border-l-4"
                : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
            }`
          }
          style={({ isActive }) =>
            isActive
              ? {
                  borderLeftColor: "#A24689",
                  paddingLeft: "calc(1.5rem - 4px)",
                }
              : {}
          }
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="flex-1">Settings</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NavLink>
      </nav>

      {/* Logout Section */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        {/* Logout Button */}
        <div className="px-4 pb-5">
          <button
            onClick={() => useAuth().logout()}
            className="group/logout w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-300 active:scale-[0.98]"
          >
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover/logout:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <div className="text-[10px] text-gray-400 text-center">
            v1.0.0 • © 2025 WorkZen
          </div>
        </div>
      </div>
    </aside>
  );
}
