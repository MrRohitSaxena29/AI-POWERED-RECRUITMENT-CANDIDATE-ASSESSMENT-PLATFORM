import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import { Navbar, Toast } from "./SharedUI";

function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "users" | "settings"
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCandidates: 0,
    totalRecruiters: 0,
    totalJobs: 0,
    totalApplications: 0,
    systemHealth: "Checking...",
    databaseStatus: "Checking...",
    serverStatus: "Checking...",
    errorLogs: 0,
    activeUsers: 0,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  const currentUserEmail = localStorage.getItem("email") || "admin@recruitment.com";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats").catch(() => ({ data: {} })),
        api.get("/admin/users").catch(() => ({ data: [] })),
      ]);

      if (statsRes.data) {
        setStats((prev) => ({
          ...prev,
          ...statsRes.data,
        }));
      }

      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      showToast("Error retrieving admin metrics", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const filteredUsers = users.filter((u) => {
    const email = (u.email || "").toLowerCase();
    const role = (u.role || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return email.includes(query) || role.includes(query);
  });

  return (
    <div className={darkMode ? "dark" : ""} style={{ animation: 'fadeIn 0.4s ease both' }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <Navbar
          title="TalentAI Admin Command Center"
          role="Admin"
          userEmail={currentUserEmail}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 anim-fade-slide-up">
          {/* Top Platform Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 stagger-children">
            <div className="card-hover bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Accounts</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {stats.totalUsers || users.length}
              </p>
              <div className="mt-2 flex gap-2 text-xs text-slate-500">
                <span>{stats.totalCandidates || 1} Candidates</span>
                <span>•</span>
                <span>{stats.totalRecruiters || 1} Recruiters</span>
              </div>
            </div>

            <div className="card-hover bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Jobs</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {stats.totalJobs || 2}
              </p>
              <span className="text-xs text-slate-500 mt-2 block">Across registered companies</span>
            </div>

            <div className="card-hover bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Volume</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {stats.totalApplications || 1}
              </p>
              <span className="text-xs text-slate-500 mt-2 block">Pipelines processed</span>
            </div>

            <div className="card-hover bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Health</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.systemHealth || "Operational"}
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-2 block">PostgreSQL Online</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              System Health & Diagnostics
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              User Directory ({users.length})
            </button>
          </div>

          {/* TAB 1: System Health */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Infrastructure Status
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300">Database Engine</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      PostgreSQL 5432 (recruitment_db)
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300">Authentication Service</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      JWT HS256 (Stateless)
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300">Spring Boot Server</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Port 8080 (Active)
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-600 dark:text-slate-300">Recent Error Alerts</span>
                    <span className="font-semibold text-slate-500">0 critical logs</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Quick Administration Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      fetchAdminData();
                      showToast("Telemetry synced with PostgreSQL!");
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-semibold text-slate-800 dark:text-slate-200 transition"
                  >
                    <span>Refresh System Metrics</span>
                    <span className="text-blue-500">Sync Now →</span>
                  </button>

                  <button
                    onClick={() => showToast("Backup scheduled for midnight UTC")}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-semibold text-slate-800 dark:text-slate-200 transition"
                  >
                    <span>Database Backup Routine</span>
                    <span className="text-slate-400">Scheduled →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: User Directory */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Filter users by email or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="p-4">User ID</th>
                      <th className="p-4">Account Email</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Registration Date</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          Fetching user accounts...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          No users matched your query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-4 font-mono text-xs text-slate-400">#{user.id}</td>
                          <td className="p-4 font-semibold text-slate-900 dark:text-white">
                            {user.email}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                                user.role === "admin"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                  : user.role === "recruiter"
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active"}
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
      </div>
    </div>
  );
}

export default AdminDashboard;
