// autoCancel.js

import { logViolation } from "./logsManager.js";

/**
 * Cancels the interview session for a candidate after repeated cheating.
 * @param {string} candidateId - Unique identifier for the candidate
 * @param {string} reason - Reason for cancellation (default: "Repeated cheating detected")
 * @returns {object} - Cancellation status object
 */
export function cancelInterview(candidateId, reason = "Repeated cheating detected") {
  const result = {
    status: "cancelled",
    candidateId,
    reason,
    timestamp: new Date()
  };

  // Log the violation for recruiter review
  logViolation(candidateId, reason);

  console.log(`Interview cancelled for candidate: ${candidateId}. Reason: ${reason}`);
  return result;
}
