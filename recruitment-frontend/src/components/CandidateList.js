import React from "react";

function CandidateList({ candidates = [], onUpdateStatus, onViewDetails }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        No candidates to display in this view.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-800 dark:text-white flex justify-between items-center">
        <span>Active Applicants</span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
          {candidates.length} Total
        </span>
      </div>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
            <th className="p-3">Candidate</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {candidates.map((c) => {
            const name = c.candidate?.name || c.name || "Candidate";
            const role = c.jobTitle || c.job?.title || "Applicant";
            const status = c.status || "Applied";

            return (
              <tr key={c.id || Math.random()} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                  {name}
                </td>
                <td className="p-3 text-slate-500">{role}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      status === "Shortlisted"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : status === "Interview Scheduled"
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                        : status === "Accepted"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {onUpdateStatus && (
                    <button
                      onClick={() => onUpdateStatus(c.id, "Shortlisted")}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                    >
                      Shortlist
                    </button>
                  )}
                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(c)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateList;
