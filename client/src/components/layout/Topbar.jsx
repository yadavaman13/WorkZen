// src/components/layout/Topbar.jsx
export default function Topbar() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Page title */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                Riya Kapoor
              </div>
              <div className="text-xs text-gray-500">HR Officer</div>
            </div>
            <img
              alt="avatar"
              className="h-9 w-9 rounded-full border-2 border-gray-200 object-cover"
              src="https://i.pravatar.cc/80?img=5"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
