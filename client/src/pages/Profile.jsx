import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import { useAuth } from "../context/AuthProvider.jsx";

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    employee_id: "",
    company_name: "",
    name: "",
    email: "",
    phone: "",
    profile_completion: 0,
    created_at: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // TODO: Fetch user profile data from API
    // For now, using mock data
    const mockData = {
      employee_id: "EMP001",
      company_name: "WorkZen Technologies",
      name: user?.name || "John Doe",
      email: user?.email || "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      profile_completion: 85,
      created_at: "2024-01-15T10:30:00Z",
    };
    setProfileData(mockData);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to update profile
    console.log("Updated profile data:", profileData);
    alert("Profile updated successfully!");
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-bold text-gray-900 ">User Profile</h1>
          <p className="text-sm text-gray-500 mt-2">
            Manage your personal information and account details
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* Profile Header */}
          <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Personal Information
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Profile completion: {profileData.profile_completion}%
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                style={{ backgroundColor: "#A24689" }}
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  style={{ backgroundColor: "#A24689" }}
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  name="employee_id"
                  value={profileData.employee_id}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={profileData.company_name}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-all ${
                    isEditing
                      ? "focus:ring-2 focus:ring-[#A24689] focus:border-transparent bg-white"
                      : "bg-gray-50 text-gray-700 cursor-not-allowed"
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-all ${
                    isEditing
                      ? "focus:ring-2 focus:ring-[#A24689] focus:border-transparent bg-white"
                      : "bg-gray-50 text-gray-700 cursor-not-allowed"
                  }`}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg outline-none transition-all ${
                    isEditing
                      ? "focus:ring-2 focus:ring-[#A24689] focus:border-transparent bg-white"
                      : "bg-gray-50 text-gray-700 cursor-not-allowed"
                  }`}
                />
              </div>

              {/* Account Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Created
                </label>
                <input
                  type="text"
                  value={formatDate(profileData.created_at)}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* Profile Completion Progress Bar */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Profile Completion
                </label>
                <span className="text-sm font-semibold" style={{ color: "#A24689" }}>
                  {profileData.profile_completion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${profileData.profile_completion}%`,
                    backgroundColor: "#A24689",
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Complete your profile to unlock all features
              </p>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
