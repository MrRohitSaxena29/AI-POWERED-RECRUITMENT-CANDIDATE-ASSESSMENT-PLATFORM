import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import { Navbar, Toast } from "./SharedUI";

function CandidateDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("applied"); // "applied" | "jobs" | "profile"
  const [profile, setProfile] = useState({
    name: "Candidate",
    email: "",
    phone: "",
    skills: ["Java", "React", "Spring Boot", "PostgreSQL"],
    resumeUrl: "",
  });

  const [applications, setApplications] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [applyingJobId, setApplyingJobId] = useState(null);

  // Resume Upload simulation & handling
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  const fetchCandidateData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, appsRes, jobsRes] = await Promise.all([
        api.get("/auth/me").catch(() => ({ data: {} })),
        api.get("/applications").catch(() => ({ data: [] })),
        api.get("/jobs").catch(() => ({ data: [] })),
      ]);

      if (userRes.data) {
        setProfile((prev) => ({
          ...prev,
          name: userRes.data.name || "Rohit Candidate",
          email: userRes.data.email || "candidate@recruitment.com",
          phone: "+1 (555) 0199",
          resumeUrl: "#",
        }));
      }

      setApplications(appsRes.data || []);
      setAvailableJobs(jobsRes.data || []);
    } catch (err) {
      console.error("Error loading candidate data:", err);
      showToast("Could not sync candidate dashboard", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);

  // Apply to an active job from the job directory
  const handleApplyToJob = async (job) => {
    setApplyingJobId(job.id);
    try {
      const res = await api.post("/apply", {
        jobTitle: job.title,
        company: job.company?.name || "Apex AI Technologies",
      });
      setApplications([res.data, ...applications]);
      showToast(`Successfully applied to ${job.title}!`);
    } catch (err) {
      console.error("Failed to apply:", err);
      showToast("Application submission failed. Try again.", "error");
    } finally {
      setApplyingJobId(null);
    }
  };

  // Handle Resume File Selection & Upload with AI Parsing
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      showToast("Please select a PDF or Word document.", "error");
      return;
    }

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResumeFile(file);

      // Extract skills from AI parsed data
      let parsed = {};
      try {
        parsed = typeof res.data.parsedData === "string" ? JSON.parse(res.data.parsedData) : res.data.parsedData;
      } catch (err) {}

      if (parsed && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
        setProfile((prev) => ({
          ...prev,
          skills: Array.from(new Set([...prev.skills, ...parsed.skills])),
          resumeUrl: res.data.fileUrl || (prev.resumeUrl || URL.createObjectURL(file)),
        }));
        showToast(`AI extracted ${parsed.skills.length} skills from "${file.name}"!`);
      } else {
        setProfile((prev) => ({
          ...prev,
          resumeUrl: res.data.fileUrl || URL.createObjectURL(file),
        }));
        showToast(`Resume "${file.name}" uploaded successfully!`);
      }
    } catch (err) {
      console.error("Resume upload failed:", err);
      const msg = err.response?.data?.message || err.response?.data || "Resume upload failed. Please try again.";
      showToast(typeof msg === "string" ? msg : "Resume upload failed. Please try again.", "error");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className={darkMode ? "dark" : ""} style={{ animation: 'fadeIn 0.4s ease both' }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <Navbar
          title="TalentAI Candidate Portal"
          role="Candidate"
          userEmail={profile.email}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-8 anim-fade-slide-up">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-xl shadow-indigo-900/20 card-hover">
            <div className="relative z-10 max-w-2xl space-y-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
                Career Dashboard
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome back, {profile.name}!
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                Track your active applications, explore new roles matched by AI, and keep your professional credentials updated.
              </p>
            </div>
            {/* Ambient Background Circles */}
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute right-24 bottom-0 -mb-12 w-48 h-48 rounded-full bg-purple-500/20 blur-xl pointer-events-none" />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[
              { key: "applied", label: `My Applications (${applications.length})` },
              { key: "jobs",    label: `Explore Open Jobs (${availableJobs.length})` },
              { key: "profile", label: "Profile & Resume" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="btn-press px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200"
                style={{
                  background: activeTab === tab.key ? "#2563eb" : "transparent",
                  color: activeTab === tab.key ? "#fff" : undefined,
                  boxShadow: activeTab === tab.key ? "0 4px 12px -2px rgba(37,99,235,0.4)" : "none",
                  transform: activeTab === tab.key ? "scale(1.04)" : "scale(1)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Applied Jobs Tracking */}
          {activeTab === "applied" && (
            <div className="space-y-4 anim-slide-right">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Applications</h3>
                  <span className="text-xs text-slate-400">Status updates automatically in real-time</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="p-4 font-semibold">Position & Company</th>
                        <th className="p-4 font-semibold">Stage</th>
                        <th className="p-4 font-semibold">AI Match / Feedback</th>
                        <th className="p-4 font-semibold">Applied Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-slate-400">
                            Loading your applications...
                          </td>
                        </tr>
                      ) : applications.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-12 text-center text-slate-400">
                            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">No applications yet</p>
                            <p className="text-xs text-slate-400 mt-1">Browse the "Explore Open Jobs" tab to apply to your first role!</p>
                            <button
                              onClick={() => setActiveTab("jobs")}
                              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                            >
                              Explore Opportunities
                            </button>
                          </td>
                        </tr>
                      ) : (
                        applications.map((app) => {
                          const jobTitle = app.jobTitle || app.job?.title || "Software Engineer";
                          const company = app.company || app.job?.company?.name || "Apex AI";

                          return (
                            <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors duration-150" style={{ animation: 'staggerUp 0.35s ease both' }}>
                              <td className="p-4">
                                <div className="font-semibold text-slate-900 dark:text-white">{jobTitle}</div>
                                <div className="text-xs text-slate-400">{company}</div>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                    app.status === "Interview Scheduled"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                      : app.status === "Shortlisted"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                      : app.status === "Accepted"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                      : app.status === "Rejected"
                                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {app.status}
                                </span>
                              </td>
                              <td className="p-4">
                                {app.aiReport ? (
                                  <div className="text-xs">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                      ⭐ {app.aiReport.matchScore}% Match
                                    </span>
                                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                      {app.aiReport.insights}
                                    </p>
                                  </div>
                                ) : app.assessment ? (
                                  <span className="text-xs font-semibold text-emerald-600">
                                    Test Score: {app.assessment.score}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">Under Review</span>
                                )}
                              </td>
                              <td className="p-4 text-xs text-slate-500">
                                {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Recently"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Explore Open Jobs */}
          {activeTab === "jobs" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableJobs.length === 0 ? (
                  <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    No open job postings right now. Check back soon!
                  </div>
                ) : (
                  availableJobs.map((job) => {
                    const alreadyApplied = applications.some(
                      (a) => (a.jobTitle || a.job?.title) === job.title
                    );
                    const isApplying = applyingJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                              {job.title}
                            </h4>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                              {job.location || "Remote"}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-400">
                            {job.company?.name || "Apex AI Technologies"}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                            {job.description || "Exciting engineering role working on scalable AI and cloud architectures."}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recent"}
                          </span>

                          <button
                            onClick={() => handleApplyToJob(job)}
                            disabled={alreadyApplied || isApplying}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                              alreadyApplied
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:opacity-90"
                            }`}
                          >
                            {alreadyApplied ? "Already Applied ✓" : isApplying ? "Submitting..." : "Apply Now →"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Profile & Resume Management */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Personal Profile</h3>
                  <p className="text-xs text-slate-400">Contact information visible to recruiters</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Technical Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => showToast("Profile changes saved!")}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Resume Upload Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Resume File</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Upload a PDF for AI parsing & match scoring</p>

                  <div className="mt-4 p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center hover:border-blue-500 transition cursor-pointer relative bg-slate-50/50 dark:bg-slate-800/30">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-2 pointer-events-none">
                      <svg className="w-8 h-8 text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {uploadingResume ? "Uploading & parsing..." : "Drop PDF resume here or click to browse"}
                      </div>
                      <p className="text-[11px] text-slate-400">PDF, DOCX up to 10MB</p>
                    </div>
                  </div>

                  {resumeFile && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate text-emerald-800 dark:text-emerald-300 font-semibold">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{resumeFile.name}</span>
                      </div>
                      <a
                        href={profile.resumeUrl}
                        download={resumeFile.name}
                        className="text-blue-600 hover:underline font-semibold ml-2 flex-shrink-0"
                      >
                        Preview
                      </a>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                  💡 <strong>Tip:</strong> An AI-parsed resume improves your candidate match score across all technical openings.
                </div>
              </div>
            </div>
          )}
        </div>

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
      </div>
    </div>
  );
}

export default CandidateDashboard;
