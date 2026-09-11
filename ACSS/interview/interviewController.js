// interviewController.js

import interviewService from "./interviewService.js";

/**
 * Start an interview session for a candidate.
 * @param {string} candidateId - Unique identifier for the candidate
 */
export function startInterview(candidateId) {
  return interviewService.startSession(candidateId);
}

/**
 * Handle candidate activity during the interview.
 * @param {string} candidateId - Candidate ID
 * @param {object} event - Activity event (e.g., { type: "tabSwitch" })
 * @returns {object|null} - Result of behavior analysis
 */
export function handleActivity(candidateId, event) {
  const result = interviewService.processActivity(candidateId, event);

  if (result) {
    if (result.status === "warning") {
      console.log(`Warning issued to ${candidateId}. Violations: ${result.violations}`);
    } else if (result.status === "cancelled") {
      console.log(`Interview cancelled for ${candidateId}`);
    }
    return result;
  }

  return result;
}

/**
 * End the interview session.
 * @param {string} candidateId - Candidate ID
 */
export function endInterview(candidateId) {
  return interviewService.endSession(candidateId);
}

/**
 * Force cancel interview (manual recruiter override).
 * @param {string} candidateId - Candidate ID
 */
export function forceCancelInterview(candidateId) {
  return interviewService.forceCancel(candidateId);
}
