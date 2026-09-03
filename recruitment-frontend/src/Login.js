import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tabDirection, setTabDirection] = useState("right"); // for slide direction

  const navigate = useNavigate();

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post("/auth/register", { name, email, password, role });
        const { role: userRole, token, email: userEmail } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", userRole);
        localStorage.setItem("email", userEmail || email);
        redirectToDashboard(userRole);
      } else {
        const res = await api.post("/auth/login", { email, password });
        const { role: userRole, token, email: userEmail } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", userRole);
        localStorage.setItem("email", userEmail || email);
        redirectToDashboard(userRole);
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        (isRegister ? "Registration failed. Try a different email." : "Invalid email or password.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const redirectToDashboard = (userRole) => {
    if (userRole === "admin") navigate("/admin");
    else if (userRole === "recruiter") navigate("/recruiter");
    else navigate("/candidate");
  };

  const switchTab = (toRegister) => {
    setTabDirection(toRegister ? "right" : "left");
    setIsRegister(toRegister);
    setError("");
  };

  const quickLogin = (demoEmail, demoPassword) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#060b1a] text-slate-100 p-4 overflow-hidden">

      {/* ── Floating Orb Background ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Subtle grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Login Card ── */}
      <div
        className="relative z-10 w-full max-w-md"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(36px)",
          transition: "opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div className="glass rounded-2xl shadow-2xl shadow-black/60 p-8">

          {/* Brand Header */}
          <div className="text-center mb-7">
            {/* Icon with rotating gradient ring */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, #6366f1, #3b82f6, #8b5cf6, #6366f1)",
                  animation: "spin 4s linear infinite",
                  padding: "2px",
                  borderRadius: "50%",
                }}
              />
              <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-[#060b1a]">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight gradient-text">TalentAI Platform</h1>
            <p className="text-xs text-slate-400 mt-1">AI-Powered Recruitment & Assessment</p>
          </div>

          {/* Tab Switcher */}
          <div className="relative flex bg-slate-900/70 rounded-xl p-1 mb-6 border border-slate-800">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30"
              style={{
                left: isRegister ? "calc(50% + 2px)" : "4px",
                transition: "left 0.3s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <button
              type="button"
              onClick={() => switchTab(false)}
              className="relative z-10 flex-1 py-2 text-sm font-semibold text-center rounded-lg transition-colors duration-200"
              style={{ color: !isRegister ? "#fff" : "rgba(148,163,184,0.8)" }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab(true)}
              className="relative z-10 flex-1 py-2 text-sm font-semibold text-center rounded-lg transition-colors duration-200"
              style={{ color: isRegister ? "#fff" : "rgba(148,163,184,0.8)" }}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/70 border border-red-500/50 rounded-lg text-xs text-red-300 anim-fade-in flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Auth Form — slides based on tab direction */}
          <form
            key={isRegister ? "register" : "login"}
            onSubmit={handleAuth}
            className="space-y-4"
            style={{
              animation: `${tabDirection === "right" ? "slideInRight" : "slideInLeft"} 0.32s cubic-bezier(0.22,1,0.36,1) both`,
            }}
          >
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-glow w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glow w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glow w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">I am registering as</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "candidate", icon: "🎯", label: "Candidate" },
                    { value: "recruiter", icon: "💼", label: "Recruiter / HR" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className="btn-press py-2.5 text-xs font-medium rounded-xl border text-center transition-all duration-200"
                      style={{
                        background: role === opt.value ? "rgba(59,130,246,0.15)" : "rgba(15,23,42,0.8)",
                        borderColor: role === opt.value ? "#3b82f6" : "rgba(51,65,85,0.8)",
                        color: role === opt.value ? "#93c5fd" : "rgba(148,163,184,0.8)",
                        transform: role === opt.value ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-press relative w-full py-3 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 disabled:opacity-60"
              style={{
                background: loading
                  ? "rgba(37,99,235,0.7)"
                  : "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                boxShadow: loading ? "none" : "0 8px 24px -4px rgba(59,130,246,0.45)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="anim-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Please wait...
                </span>
              ) : isRegister ? (
                "Create Account & Sign In →"
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-7 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">
              ⚡ Quick Demo (1-Click Fill)
            </p>
            <div className="grid grid-cols-3 gap-2 stagger-children">
              {[
                { icon: "👑", label: "Admin", email: "admin@recruitment.com", pass: "admin123", color: "#f59e0b" },
                { icon: "💼", label: "Recruiter", email: "recruiter@recruitment.com", pass: "recruiter123", color: "#3b82f6" },
                { icon: "🎯", label: "Candidate", email: "candidate@recruitment.com", pass: "candidate123", color: "#10b981" },
              ].map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => quickLogin(demo.email, demo.pass)}
                  className="btn-press group relative px-2 py-2 bg-slate-900/70 border border-slate-800 text-[11px] rounded-xl text-slate-400 font-medium transition-all duration-200 hover:border-slate-600 hover:text-slate-200 overflow-hidden"
                >
                  {/* Hover color accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: demo.color }}
                  />
                  {demo.icon} {demo.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-[11px] text-slate-600 mt-4">
          Secured with JWT · Powered by Spring Boot & React
        </p>
      </div>
    </div>
  );
}

export default Login;
