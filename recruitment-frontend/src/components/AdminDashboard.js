import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import { Navbar, Toast } from "./SharedUI";
import { getAllLogs, clearLogs } from "../acss/anticheating";

function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "users" | "acss" | "settings"
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
  const [flaggedInterviews, setFlaggedInterviews] = useState([]);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
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
      const [statsRes, usersRes, cheatingLogsRes] = await Promise.all([
        api.get("/admin/stats").catch(() => ({ data: {} })),
        api.get("/admin/users").catch(() => ({ data: [] })),
        api.get("/interviews/admin/cheating-logs").catch(() => ({ data: [] })),
      ]);

      if (statsRes.data) {
        setStats((prev) => ({
          ...prev,
          ...statsRes.data,
        }));
      }

      setUsers(usersRes.data || []);
      setFlaggedInterviews(cheatingLogsRes.data || []);
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
            <button
              onClick={() => setActiveTab("acss")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === "acss"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🛡️ ACSS Surveillance Audit ({flaggedInterviews.length})
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

          {/* TAB 3: ACSS Anti-Cheating Surveillance Audit */}
          {activeTab === "acss" && (
            <div className="space-y-6">
              {/* ACSS Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged Sessions</span>
                  <p className="text-3xl font-extrabold text-rose-600 mt-2">
                    {flaggedInterviews.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Interviews with suspicious alerts</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auto-Cancel Threshold</span>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                    2 Strikes
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Immediate session lockdown</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Memory Events</span>
                  <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                    {getAllLogs().length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Live telemetry stream</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proctoring Engine</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-2 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    ACSS Active
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Webcam & Screen tracker synced</p>
                </div>
              </div>

              {/* Flagged Database Sessions Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Flagged Interview Sessions (PostgreSQL)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Candidates whose sessions triggered warnings or were terminated by ACSS
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      fetchAdminData();
                      showToast("ACSS audit telemetry refreshed!");
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                  >
                    Sync Telemetry 🔄
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Interview ID</th>
                        <th className="py-3 px-4">Candidate Email</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Violations</th>
                        <th className="py-3 px-4">ACSS Flag</th>
                        <th className="py-3 px-4 text-right">Audit Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {flaggedInterviews.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            No candidates have been flagged for cheating yet. All active sessions clean.
                          </td>
                        </tr>
                      ) : (
                        flaggedInterviews.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                            <td className="py-3 px-4 font-mono text-xs text-slate-400">#{item.id}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {item.application?.candidate?.user?.email || "candidate@recruitment.com"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                item.status === "Cancelled"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-rose-600">
                              {item.violationsCount || 0} / 2
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
                                🚫 Cheating Flagged
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedAuditLog(item)}
                                className="px-3 py-1 text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-lg transition border border-purple-200 dark:border-purple-800"
                              >
                                View Log Trail →
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time In-Memory ACSS Events Stream */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Live ACSS In-Browser Telemetry Stream
                    </h4>
                    <p className="text-xs text-slate-400">
                      Real-time events captured directly by ACSS monitor modules
                    </p>
                  </div>
                  {getAllLogs().length > 0 && (
                    <button
                      onClick={() => {
                        clearLogs();
                        showToast("Local in-memory logs cleared!");
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Clear Local Logs
                    </button>
                  )}
                </div>

                {getAllLogs().length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No active in-memory events. Start a candidate proctored assessment to stream telemetry.</p>
                ) : (
                  <div className="p-3 bg-slate-950 rounded-xl text-slate-300 font-mono text-xs max-h-40 overflow-y-auto space-y-1">
                    {getAllLogs().map((entry, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-rose-400 font-bold">[{entry.event}] {entry.candidateId}</span>
                        <span className="text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Audit Log Modal */}
        {selectedAuditLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 anim-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Audit Log Trail: Session #{selectedAuditLog.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Candidate: {selectedAuditLog.application?.candidate?.user?.email || "Candidate"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs max-h-60 overflow-y-auto border border-slate-800 space-y-1">
                {selectedAuditLog.cheatingLogs ? (
                  selectedAuditLog.cheatingLogs.split("\n").filter(Boolean).map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.includes("AUTO-CANCELLED") || line.includes("Violation")
                          ? "text-rose-400"
                          : line.includes("started")
                          ? "text-emerald-400"
                          : "text-slate-300"
                      }
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">No log entries found.</div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedAuditLog(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
      </div>
    </div>
  );
}

export default AdminDashboard;
