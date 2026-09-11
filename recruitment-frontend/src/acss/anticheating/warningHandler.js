import { logViolation } from "./logsManager.js";

/**
 * Keeps track of violation counts per candidate.
 * Key: candidateId, Value: number of violations
 */
const violationCount = new Map();

/**
 * Issue a warning to the candidate and increment violation count.
 * @param {string} candidateId - Unique identifier for the candidate
 * @param {string} event - Type of violation (optional, e.g., "tabSwitch")
 * @returns {object} - Warning status object
 */
export function issueWarning(candidateId, event = "Suspicious activity") {
  const violations = (violationCount.get(candidateId) || 0) + 1;
  violationCount.set(candidateId, violations);

  // Log the violation
  logViolation(candidateId, event);

  const result = {
    status: "warning",
    candidateId,
    violations,
    message: `Warning issued. Total violations: ${violations}`
  };

  console.warn(`Warning for ${candidateId}: ${event}. Count = ${violations}`);
  return result;
}

/**
 * Get the number of violations for a candidate.
 * @param {string} candidateId - Candidate ID
 * @returns {number} - Violation count
 */
export function getViolations(candidateId) {
  return violationCount.get(candidateId) || 0;
}

/**
 * Reset violations for a candidate (e.g., after recruiter review).
 * @param {string} candidateId - Candidate ID
 */
export function resetViolations(candidateId) {
  violationCount.delete(candidateId);
  console.log(`Violations reset for candidate: ${candidateId}`);
}
