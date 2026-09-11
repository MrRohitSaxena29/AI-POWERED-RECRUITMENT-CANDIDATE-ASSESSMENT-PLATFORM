import {
  analyzeBehavior,
  getViolations,
  cancelInterview,
  getLogs,
  resetViolations
} from "../anticheating/index.js";

/**
 * Service layer for interview operations in frontend.
 * Integrates anti-cheating checks with local session tracking.
 */
class InterviewService {
  constructor() {
    this.sessions = {};
  }

  startSession(candidateId) {
    resetViolations(candidateId);
    this.sessions[candidateId] = {
      status: "active",
      violations: 0,
      logs: [],
      startedAt: new Date()
    };

    return {
      status: "started",
      candidateId,
      timestamp: this.sessions[candidateId].startedAt
    };
  }

  processActivity(candidateId, event) {
    const session = this.sessions[candidateId];
    if (!session || session.status !== "active") {
      return { status: "error", message: "No active session found" };
    }

    const result = analyzeBehavior(candidateId, event);

    if (result) {
      session.violations = getViolations(candidateId);
      session.logs = getLogs(candidateId);

      if (result.status === "cancelled") {
        session.status = "cancelled";
      }
      return result;
    }

    return { status: "ok", candidateId, message: "No suspicious activity" };
  }

  endSession(candidateId) {
    const session = this.sessions[candidateId];
    if (!session) {
      return { status: "error", message: "No active session found" };
    }

    session.status = "ended";

    return {
      status: "ended",
      candidateId,
      violations: session.violations,
      logs: session.logs,
      startedAt: session.startedAt,
      endedAt: new Date()
    };
  }

  forceCancel(candidateId) {
    const session = this.sessions[candidateId];
    if (!session || session.status !== "active") {
      return { status: "error", message: "No active session found" };
    }

    session.status = "cancelled";
    return cancelInterview(candidateId, "Recruiter override");
  }

  getSession(candidateId) {
    return this.sessions[candidateId] || null;
  }
}

const interviewServiceInstance = new InterviewService();
export default interviewServiceInstance;
