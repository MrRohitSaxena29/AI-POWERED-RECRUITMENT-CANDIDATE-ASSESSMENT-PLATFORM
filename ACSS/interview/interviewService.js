// interviewService.js

import {
  analyzeBehavior,
  getViolations,
  cancelInterview,
  getLogs
} from "../anticheating/index.js";

/**
 * Service layer for interview operations.
 * Handles candidate data and integrates anti-cheating checks.
 */
class InterviewService {
  constructor() {
    this.sessions = {}; // Store active interview sessions
  }

  /**
   * Start a new interview session.
   * @param {string} candidateId
   * @returns {object}
   */
  startSession(candidateId) {
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

  /**
   * Process candidate activity and run anti-cheating checks.
   * @param {string} candidateId
   * @param {object} event
   * @returns {object}
   */
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

  /**
   * End interview session and return summary.
   * @param {string} candidateId
   * @returns {object}
   */
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

  /**
   * Force cancel interview (manual recruiter override).
   * @param {string} candidateId
   * @returns {object}
   */
  forceCancel(candidateId) {
    const session = this.sessions[candidateId];
    if (!session || session.status !== "active") {
      return { status: "error", message: "No active session found" };
    }

    session.status = "cancelled";
    return cancelInterview(candidateId, "Recruiter override");
  }
}

export default new InterviewService();
