// src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";

const navItem =
  "flex items-center gap-3 pl-6 pr-4 py-3 transition-all text-sm font-medium";

export default function Sidebar() {
  return (
    <aside className="h-screen w-56 border-r border-gray-200 bg-white hidden md:flex md:flex-col md:sticky md:top-0">
      {/* Logo Section */}
      <div className="px-6 pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
          to="/landingpage"
          className={({ isActive }) =>
            `${navItem} ${
              isActive
                ? "bg-gray-200 text-gray-900 border-l-4 border-gray-900 pl-[20px]"
                : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
            }`
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
          Employees
        </NavLink>
        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `${navItem} ${
              isActive
                ? "bg-gray-200 text-gray-900 border-l-4 border-gray-900 pl-[20px]"
                : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
            }`
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
          Attendance
        </NavLink>
        <NavLink
          to="/time-off"
          className={({ isActive }) =>
            `${navItem} ${
              isActive
                ? "bg-gray-200 text-gray-900 border-l-4 border-gray-900 pl-[20px]"
                : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
            }`
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
          Time Off
        </NavLink>
        <NavLink
          to="/payroll"
          className={({ isActive }) =>
            `${navItem} ${
              isActive
                ? "bg-gray-200 text-gray-900 border-l-4 border-gray-900 pl-[20px]"
                : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
            }`
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
          Payroll
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `${navItem} ${
              isActive
                ? "bg-gray-200 text-gray-900 border-l-4 border-gray-900 pl-[20px]"
                : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
            }`
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
          Reports
        </NavLink>

        <div className="pt-5 pb-2">
          <div className="px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Settings
          </div>
        </div>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${navItem} ${
              isActive
                ? "bg-gray-200 text-gray-900 border-l-4 border-gray-900 pl-[20px]"
                : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
            }`
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
          Settings
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="text-[10px] text-gray-400">v1.0.0 • © 2025</div>
      </div>
    </aside>
  );
}
