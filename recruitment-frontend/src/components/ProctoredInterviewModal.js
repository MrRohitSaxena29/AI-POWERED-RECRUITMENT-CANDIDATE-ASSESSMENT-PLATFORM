import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../api";
import {
  startInterview,
  handleActivity,
  endInterview
} from "../acss/interview/interviewController";
import { getLogs } from "../acss/anticheating";

export default function ProctoredInterviewModal({ interview, application, onClose, onSessionUpdated }) {
  const [sessionStatus, setSessionStatus] = useState("active"); // "active" | "warning" | "cancelled" | "completed"
  const [violations, setViolations] = useState(0);
  const [logs, setLogs] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const candidateId = application?.candidate?.user?.email || application?.applicantEmail || "candidate@recruitment.com";
  const interviewId = interview?.id;

  const questions = [
    {
      id: 1,
      title: "System Architecture & Scalability",
      prompt: "Explain how you would design a resilient, high-throughput notification service using event-driven architecture."
    },
    {
      id: 2,
      title: "Concurrency & Data Consistency",
      prompt: "How do you prevent race conditions when updating shared financial balance records in a distributed microservices environment?"
    },
    {
      id: 3,
      title: "Algorithmic Efficiency",
      prompt: "Describe an optimal strategy to search, deduplicate, and rank 1 million resumes based on skill keywords."
    }
  ];

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Dispatch violation event to ACSS and Backend
  const triggerViolation = useCallback(async (eventPayload) => {
    if (sessionStatus === "cancelled" || sessionStatus === "completed") return;

    // 1. Run local ACSS behavior analyzer
    const result = handleActivity(candidateId, eventPayload);

    if (result) {
      const newViolations = result.violations || violations + 1;
      setViolations(newViolations);
      setLogs(getLogs(candidateId));

      // 2. Sync violation with Spring Boot backend
      try {
        if (interviewId) {
          await api.post(`/interviews/${interviewId}/activity`, {
            candidateId,
            event: eventPayload.type || eventPayload.webcamEvent || "Suspicious activity",
            details: eventPayload.details || "Detected by ACSS browser engine"
          });
        }
      } catch (err) {
        console.error("Failed to sync ACSS violation with backend:", err);
      }

      if (result.status === "cancelled" || newViolations >= 2) {
        setSessionStatus("cancelled");
        setWarningMessage(result.reason || "Repeated cheating detected. Interview auto-cancelled.");
        stopCamera();
        if (onSessionUpdated) onSessionUpdated("cancelled");
      } else {
        setSessionStatus("warning");
        setWarningMessage(result.message || "Suspicious activity detected! Please stay focused.");
        setTimeout(() => {
          setSessionStatus((prev) => (prev === "warning" ? "active" : prev));
        }, 5000);
      }
    }
  }, [candidateId, interviewId, sessionStatus, violations, stopCamera, onSessionUpdated]);

  // Start interview session on mount
  useEffect(() => {
    startInterview(candidateId);

    // Notify backend session start
    if (interviewId) {
      api.post(`/interviews/${interviewId}/start`).catch((err) => {
        console.error("Backend start interview error:", err);
      });
    }

    // Request camera stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraActive(true);
        })
        .catch((err) => {
          console.warn("Camera access denied or unavailable, running in simulation mode:", err);
          setCameraError("Camera unavailable or permission denied. Running in Proctored Simulation Mode.");
        });
    } else {
      setCameraError("MediaDevices API not supported. Running in Proctored Simulation Mode.");
    }

    // Attach ACSS Screen Tracking listeners
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation({ type: "tabSwitch", details: "Candidate switched browser tabs or minimized browser" });
      }
    };

    const handleWindowBlur = () => {
      triggerViolation({ type: "focusLost", details: "Candidate clicked outside interview window or switched application" });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      stopCamera();
    };
  }, [candidateId, interviewId, triggerViolation, stopCamera]);

  // Handle Candidate Submitting Interview
  const handleFinishInterview = async () => {
    setSubmitting(true);
    try {
      endInterview(candidateId);
      stopCamera();

      if (interviewId) {
        await api.post(`/interviews/${interviewId}/end`, {
          feedback: `Candidate submitted ${Object.keys(answers).length} answers. ACSS Violations: ${violations}.`
        });
      }

      setSessionStatus("completed");
      if (onSessionUpdated) onSessionUpdated("completed");
    } catch (err) {
      console.error("Failed to submit interview:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden anim-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/30">
              ACSS
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Anti-Cheating Proctored Assessment
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  sessionStatus === "cancelled"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300"
                    : sessionStatus === "warning"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 animate-pulse"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                }`}>
                  {sessionStatus === "cancelled" ? "🔴 Terminated" : sessionStatus === "warning" ? "🟡 Warning" : "🟢 Active Surveillance"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Candidate: <span className="font-semibold text-slate-600 dark:text-slate-300">{candidateId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Violation Counter Badge */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              violations >= 2
                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                : violations === 1
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              <span>Violations:</span>
              <span className="text-sm">{violations} / 2</span>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close Room"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        {sessionStatus === "warning" && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-6 py-2.5 text-xs font-semibold flex items-center justify-between anim-slide-down">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span><strong>ACSS Warning #{violations}:</strong> {warningMessage}</span>
            </div>
            <span className="text-[11px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              {2 - violations} strike left
            </span>
          </div>
        )}

        {/* Cancelled / Terminated Screen */}
        {sessionStatus === "cancelled" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 dark:bg-rose-950/20">
            <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center text-4xl mb-4 shadow-xl border border-rose-300">
              🚫
            </div>
            <h3 className="text-2xl font-black text-rose-900 dark:text-rose-100">
              Interview Auto-Terminated by ACSS
            </h3>
            <p className="text-sm text-rose-700 dark:text-rose-300 max-w-md mt-2 leading-relaxed">
              Anti-Cheating Surveillance detected <strong>2 violations</strong> during this session.
              Your interview has been automatically cancelled and logged for recruiter and admin review.
            </p>

            <div className="mt-6 w-full max-w-md bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-left">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Logged Violations:</h4>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {logs.map((log, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className="font-semibold text-rose-600">Event: {log.event}</span>
                    <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="mt-6 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold transition"
            >
              Exit Interview Room
            </button>
          </div>
        ) : sessionStatus === "completed" ? (
          /* Completed Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center text-4xl mb-4 shadow-xl border border-emerald-300">
              ✅
            </div>
            <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
              Interview Submitted Successfully!
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 max-w-md mt-2 leading-relaxed">
              Your responses have been saved and anti-cheating audit verification completed with <strong>{violations} violations</strong>.
            </p>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          /* Active Interview Grid */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto">
            {/* Left Column: Questions & Coding/Text area (2 cols) */}
            <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Stepper */}
                <div className="flex items-center gap-2">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        currentQuestionIndex === idx
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : answers[q.id]
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      Question {idx + 1} {answers[q.id] && "✓"}
                    </button>
                  ))}
                </div>

                {/* Question Prompt */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {questions[currentQuestionIndex].title}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {questions[currentQuestionIndex].prompt}
                  </h3>
                </div>

                {/* Candidate Answer Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Your Response / Architecture Outline
                  </label>
                  <textarea
                    rows={8}
                    value={answers[questions[currentQuestionIndex].id] || ""}
                    onChange={(e) =>
                      setAnswers({
                        ...answers,
                        [questions[currentQuestionIndex].id]: e.target.value
                      })
                    }
                    placeholder="Type your structured solution, technical trade-offs, and design steps here..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400">
                  ⚠️ Tab switching, minimizing window, or looking away will be flagged by ACSS.
                </div>

                <div className="flex items-center gap-3">
                  {currentQuestionIndex > 0 && (
                    <button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      ← Previous
                    </button>
                  )}

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishInterview}
                      disabled={submitting}
                      className="px-6 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
                    >
                      {submitting ? "Submitting..." : "Submit & Complete Assessment ✓"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Video + ACSS Proctoring HUD */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Webcam Box */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 aspect-video shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                  />

                  {!cameraActive && (
                    <div className="text-center p-4 space-y-2 text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl mx-auto">
                        📷
                      </div>
                      <p className="text-xs font-semibold">Virtual Proctor Stream</p>
                      <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight">
                        {cameraError || "Camera active in simulated proctored mode"}
                      </p>
                    </div>
                  )}

                  {/* Overlay live badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    REC • ACSS MONITORED
                  </div>
                </div>

                {/* ACSS Live Diagnostics */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ACSS Live Proctoring</span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">● Active</span>
                  </div>

                  {/* Violation Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Violation Threshold</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{violations} of 2</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          violations === 0
                            ? "bg-emerald-500 w-0"
                            : violations === 1
                            ? "bg-amber-500 w-1/2"
                            : "bg-rose-500 w-full"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Event simulation buttons (For testing & demonstration) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Test ACSS Signal Triggers:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        onClick={() => triggerViolation({ webcamEvent: "gazeAway", details: "Candidate looked away from screen" })}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 font-medium text-slate-700 dark:text-slate-300 transition text-left truncate"
                        title="Simulate Gaze Away"
                      >
                        👁️ Gaze Away
                      </button>
                      <button
                        onClick={() => triggerViolation({ webcamEvent: "multipleFaces", details: "Multiple faces detected in camera" })}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 font-medium text-slate-700 dark:text-slate-300 transition text-left truncate"
                        title="Simulate Multiple Faces"
                      >
                        👥 Multiple Faces
                      </button>
                      <button
                        onClick={() => triggerViolation({ type: "tabSwitch", details: "Tab switch detected via visibility API" })}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 font-medium text-slate-700 dark:text-slate-300 transition text-left truncate"
                        title="Simulate Tab Switch"
                      >
                        📑 Tab Switch
                      </button>
                      <button
                        onClick={() => triggerViolation({ webcamEvent: "noFaceDetected", details: "Candidate absent from camera" })}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 font-medium text-slate-700 dark:text-slate-300 transition text-left truncate"
                        title="Simulate No Face"
                      >
                        👤 No Face
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logs Stream */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Audit Feed:
                </span>
                {logs.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No suspicious events logged.</p>
                ) : (
                  <ul className="space-y-1 text-[11px]">
                    {logs.map((l, i) => (
                      <li key={i} className="text-slate-600 dark:text-slate-300 flex justify-between">
                        <span className="font-semibold text-rose-500">{l.event}</span>
                        <span className="text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
