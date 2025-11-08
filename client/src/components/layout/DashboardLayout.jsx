// src/components/layout/DashboardLayout.jsx
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Topbar />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
