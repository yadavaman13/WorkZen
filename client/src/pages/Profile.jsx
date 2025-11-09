import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";
import api from "../api/axios";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" || user?.role === "payroll" ? "salary-info" : "resume"
  );
  const [profileData, setProfileData] = useState({
    name: "",
    loginId: "",
    email: "",
    mobile: "",
    company: "",
    department: "",
    manager: "",
    location: "",
  });

  const [aboutData, setAboutData] = useState({
    about: "",
    whatILove: "",
    interests: "",
  });

  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [salaryData, setSalaryData] = useState({
    monthWage: 0,
    yearlyWage: 0,
    workingDaysInWeek: 5,
    breakTime: 1,
  });

  const [privateInfo, setPrivateInfo] = useState({
    dateOfBirth: "",
    residingAddress: "",
    nationality: "",
    personalEmail: "",
    gender: "",
    maritalStatus: "",
    dateOfJoining: "",
  });

  const [salaryInfo, setSalaryInfo] = useState({
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    panNo: "",
    uanNo: "",
    empCode: "",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/profile');
      const { user: userData, profile } = response.data;

      // Set basic profile data
      setProfileData({
        name: userData.name || "",
        loginId: userData.employee_id || "",
        email: userData.email || "",
        mobile: userData.phone || "",
        company: userData.company_name || "",
        department: profile.department || "",
        manager: profile.manager || "",
        location: profile.location || "",
      });

      // Set about data
      setAboutData({
        about: profile.about || "",
        whatILove: profile.what_i_love || "",
        interests: profile.interests || "",
      });

      // Set skills and certifications
      setSkills(profile.skills || []);
      setCertifications(profile.certifications || []);

      // Set salary data
      setSalaryData({
        monthWage: parseFloat(profile.month_wage) || 0,
        yearlyWage: parseFloat(profile.yearly_wage) || 0,
        workingDaysInWeek: profile.working_days_in_week || 5,
        breakTime: parseFloat(profile.break_time) || 1,
      });

      // Set private info
      setPrivateInfo({
        dateOfBirth: profile.date_of_birth || "",
        residingAddress: profile.residing_address || "",
        nationality: profile.nationality || "",
        personalEmail: profile.personal_email || "",
        gender: profile.gender || "",
        maritalStatus: profile.marital_status || "",
        dateOfJoining: profile.date_of_joining || userData.created_at?.split('T')[0] || "",
      });

      // Set salary info
      setSalaryInfo({
        accountNumber: profile.account_number || "",
        bankName: profile.bank_name || "",
        ifscCode: profile.ifsc_code || "",
        panNo: profile.pan_no || "",
        uanNo: profile.uan_no || "",
        empCode: userData.employee_id || "",
      });

    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      setError(error.response?.data?.msg || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleAboutEdit = (field) => {
    console.log("Edit", field);
  };

  const handleAddSkill = () => {
    const skill = prompt("Enter new skill:");
    if (skill) {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCertification = () => {
    const cert = prompt("Enter new certification:");
    if (cert) {
      setCertifications([...certifications, cert]);
    }
  };

  const handleResetPassword = () => {
    navigate("/reset-password");
  };

  const tabs = [
    { id: "resume", label: "Resume" },
    { id: "private-info", label: "Private Info" },
    ...(user?.role === "admin" || user?.role === "payroll" ? [{ id: "salary-info", label: "Salary Info" }] : []),
    { id: "security", label: "Security" },
  ];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#A24689] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500">Loading profile...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={fetchProfileData}
              className="px-4 py-2 bg-[#A24689] text-white rounded-lg hover:bg-[#8a3a73] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-pink-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">{profileData.name}</h2>
                    <div className="h-px bg-gray-300 w-48"></div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Login ID</label>
                    <div className="h-px bg-gray-300 mt-1 w-48"></div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <div className="h-px bg-gray-300 mt-1 w-48"></div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Mobile</label>
                    <div className="h-px bg-gray-300 mt-1 w-48"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Company</label>
                    <div className="h-px bg-gray-300 mt-1 w-48"></div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Department</label>
                    <div className="h-px bg-gray-300 mt-1 w-48"></div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Manager</label>
                    <div className="h-px bg-gray-300 mt-1 w-48"></div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Location</label>
                    <div className="h-px bg-gray-300 mt-1 w-48"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-8 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id ? "border-gray-900 text-gray-900 bg-gray-50" : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "resume" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">About:</h3>
                      <button onClick={() => handleAboutEdit("about")} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{aboutData.about}</p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">What I love about my job</h3>
                      <button onClick={() => handleAboutEdit("whatILove")} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{aboutData.whatILove}</p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">My interests and hobbies</h3>
                      <button onClick={() => handleAboutEdit("interests")} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{aboutData.interests}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="space-y-2 mb-4">
                      {skills.map((skill, index) => (
                        <div key={index} className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">
                          {skill}
                        </div>
                      ))}
                    </div>
                    <button onClick={handleAddSkill} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      + Add Skills
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Certification</h3>
                    <div className="space-y-2 mb-4">
                      {certifications.map((cert, index) => (
                        <div key={index} className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">
                          {cert}
                        </div>
                      ))}
                    </div>
                    <button onClick={handleAddCertification} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      + Add Skills
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "salary-info" && (
              <div className="space-y-6">
                {/* Wage Information */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Month Wage</label>
                    <div className="mt-2 flex items-center gap-4">
                      <input type="text" value={salaryData.monthWage} readOnly className="px-3 py-2 border-b border-gray-300 focus:outline-none text-gray-900 w-32" />
                      <span className="text-gray-600">/ Month</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">No. of working days in a week</label>
                    <div className="mt-2">
                      <input type="text" value={salaryData.workingDaysInWeek} readOnly className="px-3 py-2 border-b border-gray-300 focus:outline-none text-gray-900 w-32" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Yearly Wage</label>
                    <div className="mt-2 flex items-center gap-4">
                      <input type="text" value={salaryData.yearlyWage} readOnly className="px-3 py-2 border-b border-gray-300 focus:outline-none text-gray-900 w-32" />
                      <span className="text-gray-600">/ Yearly</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Break Time</label>
                    <div className="mt-2 flex items-center gap-4">
                      <input type="text" value={salaryData.breakTime} readOnly className="px-3 py-2 border-b border-gray-300 focus:outline-none text-gray-900 w-32" />
                      <span className="text-gray-600">Hrs</span>
                    </div>
                  </div>
                </div>

                {/* Salary Components */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                    {/* Left Column - Earnings */}
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Basic Salary</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">25000.00 ₹/Month</span>
                            <span className="text-gray-600">50.00 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Define Basic salary (if no company cost model, it based on monthly wages)</p>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">House Rent Allowance</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">12500.00 ₹/Month</span>
                            <span className="text-gray-600">25.00 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">HRA provided to employees: 50% of the basic salary</p>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Standard Allowance</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">9167.00 ₹/Month</span>
                            <span className="text-gray-600">18.33 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">A Standard Allowance to a professional, fixed amount provided to employee</p>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Performance Bonus</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">2083.30 ₹/Month</span>
                            <span className="text-gray-600">4.16 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Variable amount and Bonus one-off salary. Also defined but calculated as a % of the basic salary</p>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Leave Travel Allowance</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">2083.30 ₹/Month</span>
                            <span className="text-gray-600">4.16 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">LTA is paid by the company to employee to cover their travel expenses and related cost during vacation or leaves</p>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Fixed Allowance</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">2416.00 ₹/Month</span>
                            <span className="text-gray-600">11.67 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Fixed Allowance paid as % of wage to determined after calculation of salary components</p>
                      </div>
                    </div>

                    {/* Right Column - Deductions */}
                    <div className="space-y-4">
                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Provident Fund (PF) Contribution</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">3000.00 ₹/Month</span>
                            <span className="text-gray-600">12.00 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">PF is calculated based on the basic salary</p>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Employee</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">3000.00 ₹/Month</span>
                            <span className="text-gray-600">12.00 %</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">PF is calculated based on the basic salary</p>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Tax Deductions</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">2000.00 ₹/Month</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">Professional Tax</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-900">200.00 ₹/Month</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">A regional tax deducted from the Gross salary</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "private-info" && (
              <div className="space-y-6">
                {/* Left Column - Personal Information */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={privateInfo.dateOfBirth}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Details
                    </label>
                    <div className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-300">
                      Bank Details
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Residing Address
                    </label>
                    <input
                      type="text"
                      value={privateInfo.residingAddress}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={salaryInfo.accountNumber}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={privateInfo.nationality}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={salaryInfo.bankName}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Email
                    </label>
                    <input
                      type="text"
                      value={privateInfo.personalEmail}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={salaryInfo.ifscCode}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <input
                      type="text"
                      value={privateInfo.gender}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN No
                    </label>
                    <input
                      type="text"
                      value={salaryInfo.panNo}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marital Status
                    </label>
                    <input
                      type="text"
                      value={privateInfo.maritalStatus}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UAN NO
                    </label>
                    <input
                      type="text"
                      value={salaryInfo.uanNo}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Joining
                    </label>
                    <input
                      type="text"
                      value={privateInfo.dateOfJoining}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emp Code
                    </label>
                    <input
                      type="text"
                      value={salaryInfo.empCode}
                      readOnly
                      className="w-full pb-2 border-b border-gray-300 focus:outline-none focus:border-[#A24689] text-gray-900 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <div className="text-center">
                    <div className="mb-6">
                      <svg
                        className="mx-auto h-16 w-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Password Security
                    </h3>
                    <p className="text-gray-600 mb-8">
                      Keep your account secure by managing your password settings
                    </p>
                    
                    <button
                      onClick={handleResetPassword}
                      className="px-8 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-lg"
                      style={{ backgroundColor: "#A24689" }}
                    >
                      Reset Password
                    </button>
                  </div>

                  {/* Security Tips */}
                  <div className="mt-10 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Password Security Tips
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Use a combination of letters, numbers, and special characters</li>
                      <li>• Avoid using personal information in your password</li>
                      <li>• Change your password regularly</li>
                      <li>• Don't share your password with anyone</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
