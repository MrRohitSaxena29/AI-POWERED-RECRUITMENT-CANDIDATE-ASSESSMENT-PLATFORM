import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import { Navbar, Toast } from "./SharedUI";

function RecruiterDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("candidates"); // "candidates" | "jobs" | "kanban"
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJob, setFilterJob] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState(null); // modal view
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [analyzingAppId, setAnalyzingAppId] = useState(null);
  const [generatingQuestionsAppId, setGeneratingQuestionsAppId] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState([]);

  // New Job Modal state
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    location: "Remote",
    company: "Apex AI Technologies",
    description: "",
  });

  const currentUserEmail = localStorage.getItem("email") || "recruiter@recruitment.com";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, jobsRes] = await Promise.all([
        api.get("/applications"),
        api.get("/jobs"),
      ]);
      setApplications(appsRes.data || []);
      setJobs(jobsRes.data || []);
    } catch (err) {
      console.error("Failed to load recruiter data:", err);
      showToast("Error loading applications or jobs", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update candidate status
  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/applications/${id}/status`, { status: newStatus });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev) => ({ ...prev, status: newStatus }));
      }
      showToast(`Candidate status updated to "${newStatus}"!`);
    } catch (err) {
      console.error("Error updating status:", err);
      showToast("Failed to update candidate status", "error");
    }
  };

  // Run AI analysis & screening on an application
  const handleAnalyzeApp = async (id) => {
    setAnalyzingAppId(id);
    try {
      const res = await api.post(`/applications/${id}/analyze`);
      const updated = res.data;
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp(updated);
      }
      showToast("AI Screening analysis complete!");
    } catch (err) {
      console.error("AI Analysis failed:", err);
      showToast("AI analysis failed. Please try again.", "error");
    } finally {
      setAnalyzingAppId(null);
    }
  };

  // Generate customized AI interview questions
  const handleGenerateQuestions = async (id) => {
    setGeneratingQuestionsAppId(id);
    try {
      const res = await api.post(`/applications/${id}/generate-questions`);
      setInterviewQuestions(res.data || []);
      showToast("Generated customized interview questions!");
    } catch (err) {
      console.error("Failed to generate questions:", err);
      showToast("Failed to generate interview questions", "error");
    } finally {
      setGeneratingQuestionsAppId(null);
    }
  };

  // Create new job posting
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title) {
      showToast("Job title is required", "error");
      return;
    }
    try {
      const res = await api.post("/jobs", newJob);
      setJobs([res.data, ...jobs]);
      setIsJobModalOpen(false);
      setNewJob({
        title: "",
        location: "Remote",
        company: "Apex AI Technologies",
        description: "",
      });
      showToast("Job opening published successfully!");
    } catch (err) {
      console.error("Error creating job:", err);
      showToast("Failed to create job posting", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // Metrics computation
  const totalApplicants = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === "Shortlisted").length;
  const interviewCount = applications.filter(
    (a) => a.status === "Interview Scheduled" || a.status === "Interview"
  ).length;
  const acceptedCount = applications.filter((a) => a.status === "Accepted").length;

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const candidateName = (app.candidate?.name || app.candidate?.user?.name || "").toLowerCase();
    const jobTitle = (app.jobTitle || app.job?.title || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = candidateName.includes(query) || jobTitle.includes(query);
    const matchesJob = filterJob === "ALL" || (app.jobTitle || app.job?.title) === filterJob;
    return matchesQuery && matchesJob;
  });

  const kanbanStages = ["Applied", "Screening", "Shortlisted", "Interview Scheduled", "Accepted"];

  return (
    <div className={darkMode ? "dark" : ""} style={{ animation: 'fadeIn 0.4s ease both' }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        <Navbar
          title="TalentAI Recruiter Suite"
          role="Recruiter"
          userEmail={currentUserEmail}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pipeline</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{totalApplicants}</p>
              <span className="text-xs text-slate-500 mt-1 block">Active candidates in review</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlisted</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{shortlistedCount}</p>
              <span className="text-xs text-slate-500 mt-1 block">Passed initial screening</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interviews</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{interviewCount}</p>
              <span className="text-xs text-slate-500 mt-1 block">Scheduled or in progress</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Openings</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{jobs.length}</p>
              <span className="text-xs text-slate-500 mt-1 block">{acceptedCount} positions accepted</span>
            </div>
          </div>

          {/* Navigation Controls & Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-xl">
              <button
                onClick={() => setActiveTab("candidates")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === "candidates"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Candidate Table
              </button>
              <button
                onClick={() => setActiveTab("kanban")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === "kanban"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Pipeline Board
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  activeTab === "jobs"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Job Openings ({jobs.length})
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsJobModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-500/25 hover:opacity-95 transition w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Post New Opening
              </button>
            </div>
          </div>

          {/* TAB 1: Candidates Table View */}
          {activeTab === "candidates" && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search candidates or job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterJob}
                  onChange={(e) => setFilterJob(e.target.value)}
                  className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
                >
                  <option value="ALL">All Job Roles</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.title}>{j.title}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="p-4 font-semibold">Candidate</th>
                        <th className="p-4 font-semibold">Applied Position</th>
                        <th className="p-4 font-semibold">Current Stage</th>
                        <th className="p-4 font-semibold">AI Match / Score</th>
                        <th className="p-4 font-semibold">Applied Date</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">
                            Loading talent pipeline...
                          </td>
                        </tr>
                      ) : filteredApps.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">
                            No candidates found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredApps.map((app) => {
                          const candidateName =
                            app.candidate?.name || app.candidate?.user?.name || "Anonymous Candidate";
                          const candidateEmail =
                            app.candidate?.user?.email || "candidate@recruitment.com";
                          const jobTitle = app.jobTitle || app.job?.title || "Engineering Role";
                          const company = app.company || app.job?.company?.name || "Apex AI";

                          return (
                            <tr
                              key={app.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                    {candidateName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">
                                      {candidateName}
                                    </div>
                                    <div className="text-xs text-slate-400">{candidateEmail}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {jobTitle}
                                </span>
                                <span className="text-xs text-slate-400 block">{company}</span>
                              </td>
                              <td className="p-4">
                                <select
                                  value={app.status}
                                  onChange={(e) => updateStatus(app.id, e.target.value)}
                                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                                    app.status === "Accepted"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
                                      : app.status === "Shortlisted"
                                      ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400"
                                      : app.status === "Interview Scheduled"
                                      ? "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400"
                                      : app.status === "Rejected"
                                      ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400"
                                      : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                                  }`}
                                >
                                  <option value="Applied">Applied</option>
                                  <option value="Screening">Screening</option>
                                  <option value="Shortlisted">Shortlisted</option>
                                  <option value="Interview Scheduled">Interview Scheduled</option>
                                  <option value="Accepted">Accepted</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              </td>
                              <td className="p-4">
                                {app.aiReport ? (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs font-semibold border border-indigo-200 dark:border-indigo-800/40">
                                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14H8a4 4 0 01-4-4V9a6 6 0 1112 0v1a4 4 0 01-4 4z" />
                                    </svg>
                                    {app.aiReport.matchScore}% AI Match
                                  </div>
                                ) : app.assessment ? (
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Score: {app.assessment.score}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">Pending Test</span>
                                )}
                              </td>
                              <td className="p-4 text-xs text-slate-500">
                                {app.appliedAt
                                  ? new Date(app.appliedAt).toLocaleDateString()
                                  : "Recently"}
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleAnalyzeApp(app.id)}
                                    disabled={analyzingAppId === app.id}
                                    className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 rounded-lg transition border border-indigo-200 dark:border-indigo-800/50 disabled:opacity-50 inline-flex items-center gap-1"
                                  >
                                    {analyzingAppId === app.id ? "Analyzing..." : "⚡ AI Screen"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApp(app);
                                      setInterviewQuestions([]);
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 rounded-lg transition border border-slate-200 dark:border-slate-700"
                                  >
                                    View Details
                                  </button>
                                </div>
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

          {/* TAB 2: Kanban Pipeline Board */}
          {activeTab === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
              {kanbanStages.map((stage) => {
                const stageApps = applications.filter(
                  (a) => a.status === stage || (stage === "Interview Scheduled" && a.status === "Interview")
                );

                return (
                  <div
                    key={stage}
                    className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col min-w-[220px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        {stage}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {stageApps.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1">
                      {stageApps.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
                          No candidates
                        </div>
                      ) : (
                        stageApps.map((app) => (
                          <div
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition space-y-2"
                          >
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                              {app.candidate?.name || app.candidate?.user?.name || "Candidate"}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {app.jobTitle || app.job?.title}
                            </div>
                            {app.aiReport && (
                              <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                ⭐ {app.aiReport.matchScore}% Match
                              </div>
                            )}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-[11px] text-slate-400">
                              <span>ID: #{app.id}</span>
                              <span className="text-blue-500 hover:underline">Inspect →</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Job Openings View */}
          {activeTab === "jobs" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const jobApplications = applications.filter(
                  (a) => (a.jobTitle || a.job?.title) === job.title
                );
                return (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {job.title}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                          {job.location || "Remote"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {job.company?.name || "Apex AI Technologies"}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">
                        {job.description || "Exciting full-stack and artificial intelligence role."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        <strong>{jobApplications.length}</strong> active applicants
                      </span>
                      <button
                        onClick={() => {
                          setFilterJob(job.title);
                          setActiveTab("candidates");
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Applicants →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CANDIDATE DETAILS MODAL */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                    {(selectedApp.candidate?.name || "C").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {selectedApp.candidate?.name || "Rohit Candidate"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedApp.candidate?.user?.email || "candidate@recruitment.com"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Target Role</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {selectedApp.jobTitle || selectedApp.job?.title} at {selectedApp.company || "Apex AI"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Phone</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                      {selectedApp.candidate?.phone || "+1-555-0199"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Current Stage</span>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      {selectedApp.status}
                    </p>
                  </div>
                </div>

                {/* AI Candidate Assessment & Screening Card */}
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                        AI Candidate Assessment
                      </span>
                      {selectedApp.aiReport && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedApp.aiReport.matchScore >= 80
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : selectedApp.aiReport.matchScore >= 60
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}>
                          {selectedApp.aiReport.matchScore >= 80 ? "Strong Match" : selectedApp.aiReport.matchScore >= 60 ? "Moderate Match" : "Review Needed"}
                        </span>
                      )}
                    </div>
                    {selectedApp.aiReport && (
                      <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                        {selectedApp.aiReport.matchScore}% Match
                      </span>
                    )}
                  </div>

                  {selectedApp.aiReport ? (
                    <p className="text-xs text-indigo-950/80 dark:text-indigo-200/90 leading-relaxed">
                      {selectedApp.aiReport.insights}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No AI analysis generated yet for this application. Click below to run automated screening against job requirements.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleAnalyzeApp(selectedApp.id)}
                      disabled={analyzingAppId === selectedApp.id}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {analyzingAppId === selectedApp.id ? "Analyzing..." : "⚡ " + (selectedApp.aiReport ? "Re-Run AI Analysis" : "Run AI Analysis")}
                    </button>
                    <button
                      onClick={() => handleGenerateQuestions(selectedApp.id)}
                      disabled={generatingQuestionsAppId === selectedApp.id}
                      className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {generatingQuestionsAppId === selectedApp.id ? "Generating Q&A..." : "🎯 Generate Interview Q&A"}
                    </button>
                  </div>
                </div>

                {/* AI Generated Interview Questions Section */}
                {interviewQuestions.length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                        Tailored AI Interview Questions ({interviewQuestions.length})
                      </h4>
                      <span className="text-[11px] text-purple-600 dark:text-purple-300 font-medium">Ready for interview</span>
                    </div>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {interviewQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900/30 text-xs space-y-1 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              {q.category || "Technical"}
                            </span>
                            <span className="text-[10px] text-slate-400">Q{idx + 1}</span>
                          </div>
                          <p className="font-semibold text-slate-900 dark:text-white pt-1">
                            {q.question}
                          </p>
                          {q.expectedCriteria && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                              <strong>Evaluation Criteria:</strong> {q.expectedCriteria}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.assessment && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <strong>Algorithmic Assessment: </strong>
                    <span className="text-emerald-600 font-bold">{selectedApp.assessment.score}%</span>
                    <p className="text-slate-500 mt-1">{selectedApp.assessment.details}</p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Change Application Stage</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Screening", "Shortlisted", "Interview Scheduled", "Accepted", "Rejected"].map(
                      (stage) => (
                        <button
                          key={stage}
                          onClick={() => updateStatus(selectedApp.id, stage)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                            selectedApp.status === stage
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {stage}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POST JOB MODAL */}
        {isJobModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create New Job Opening</h3>
                <button onClick={() => setIsJobModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Machine Learning Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={newJob.company}
                      onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Remote / Hybrid"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Role Description
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Detail the responsibilities and key requirements..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsJobModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                  >
                    Publish Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
      </div>
    </div>
  );
}

export default RecruiterDashboard;
