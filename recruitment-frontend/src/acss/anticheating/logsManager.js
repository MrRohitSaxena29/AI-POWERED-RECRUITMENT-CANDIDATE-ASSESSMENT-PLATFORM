// In-memory storage for logs
let logs = [];

/**
 * Log a violation event for a candidate.
 * @param {string} candidateId - Unique identifier for the candidate
 * @param {string} event - Type of violation (e.g., "tabSwitch", "windowMinimize", "gazeAway")
 */
export function logViolation(candidateId, event) {
  const entry = {
    candidateId,
    event,
    timestamp: new Date()
  };

  logs.push(entry);
  console.log("Violation logged:", entry);

  return entry;
}

/**
 * Retrieve all violation logs for a specific candidate.
 * @param {string} candidateId - Candidate ID
 * @returns {Array} - List of violation entries
 */
export function getLogs(candidateId) {
  return logs.filter(log => log.candidateId === candidateId);
}

/**
 * Retrieve all violation logs (for admin/recruiter dashboard).
 * @returns {Array} - Complete list of logs
 */
export function getAllLogs() {
  return logs;
}

/**
 * Clear logs for a candidate (e.g., after recruiter review).
 * @param {string} candidateId - Candidate ID
 */
export function clearLogs(candidateId) {
  logs = logs.filter(log => log.candidateId !== candidateId);
  console.log(`Logs cleared for candidate: ${candidateId}`);
}
