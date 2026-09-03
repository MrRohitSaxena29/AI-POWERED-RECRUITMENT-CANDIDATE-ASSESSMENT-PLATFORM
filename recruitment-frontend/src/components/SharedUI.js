import React, { useEffect, useState } from "react";

/* ─────────────────────────────────────
   TOAST — slides up from bottom right
───────────────────────────────────── */
export function Toast({ message, type, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      // micro-delay so the CSS transition fires
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [message]);

  if (!message) return null;

  const colors = {
    error: {
      bg: "bg-rose-600",
      border: "border-rose-700",
      shadow: "shadow-rose-900/40",
    },
    info: {
      bg: "bg-blue-600",
      border: "border-blue-700",
      shadow: "shadow-blue-900/40",
    },
    success: {
      bg: "bg-emerald-600",
      border: "border-emerald-700",
      shadow: "shadow-emerald-900/40",
    },
  };
  const c = colors[type] || colors.success;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 transition-all duration-400"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
        transitionDuration: "350ms",
        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl ${c.bg} ${c.border} ${c.shadow} text-white`}
      >
        {type === "error" ? (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-black/20 transition text-white/80 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   NAVBAR — slides down on mount
───────────────────────────────────── */
export function Navbar({ title, role, userEmail, onLogout, darkMode, setDarkMode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-12px)",
        transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{role} Workspace</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        {setDarkMode && (
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 active:scale-95"
            title="Toggle theme"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        )}

        {/* User avatar + email */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline-block max-w-[160px] truncate">
            {userEmail || "Signed In"}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="btn-press flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────── */
export function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-5/6" />
    </div>
  );
}

/* ─────────────────────────────────────
   STAT CARD — animated counter + hover lift
───────────────────────────────────── */
export function StatCard({ label, value, icon, color = "blue", delay = 0 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = parseInt(value) || 0;
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / 20);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [value]);

  const colorMap = {
    blue:   { bg: "bg-blue-500/10 dark:bg-blue-500/10",   text: "text-blue-600 dark:text-blue-400",   border: "border-blue-200 dark:border-blue-900/40" },
    green:  { bg: "bg-emerald-500/10",                     text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/40" },
    amber:  { bg: "bg-amber-500/10",                       text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/40" },
    purple: { bg: "bg-violet-500/10",                      text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-900/40" },
    rose:   { bg: "bg-rose-500/10",                        text: "text-rose-600 dark:text-rose-400",   border: "border-rose-200 dark:border-rose-900/40" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className="card-hover p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 anim-fade-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
          <span className={`text-lg ${c.text}`}>{icon}</span>
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.text}`}>
        {parseInt(value) ? display : value}
      </p>
    </div>
  );
}
