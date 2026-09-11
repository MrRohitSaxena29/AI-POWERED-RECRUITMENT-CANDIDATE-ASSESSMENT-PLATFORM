/**
 * Track screen activity events for a candidate.
 * @param {string} candidateId - Unique identifier for the candidate
 * @param {string} event - Type of screen activity (e.g., "tabSwitch", "windowMinimize", "focusLost")
 * @returns {boolean} - True if cheating/suspicious activity detected, false otherwise
 */
export function trackScreenActivity(candidateId, event) {
  console.log(`Tracking screen for candidate: ${candidateId}, event: ${event}`);

  // Define suspicious events
  const suspiciousEvents = ["tabSwitch", "windowMinimize", "focusLost"];

  if (suspiciousEvents.includes(event)) {
    console.warn(`Suspicious screen activity detected for ${candidateId}: ${event}`);
    return true; // cheating detected
  }

  return false; // no cheating detected
}
