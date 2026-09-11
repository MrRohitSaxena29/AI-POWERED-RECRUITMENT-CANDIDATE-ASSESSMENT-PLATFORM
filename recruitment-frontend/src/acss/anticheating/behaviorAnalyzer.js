import { monitorWebcam } from "./webcamMonitor.js";
import { trackScreenActivity } from "./screenTracker.js";
import { issueWarning } from "./warningHandler.js";
import { cancelInterview } from "./autoCancel.js";

/**
 * Analyze candidate behavior during the interview.
 * Combines webcam + screen tracking signals to detect cheating.
 * @param {string} candidateId - Unique identifier for the candidate
 * @param {object} event - Event object (e.g., { type: "tabSwitch" } or { webcamEvent: "gazeAway" })
 * @returns {object|null} - Action result (warning or cancellation), or null if no cheating
 */
export function analyzeBehavior(candidateId, event = {}) {
  const webcamFlag = event.webcamEvent ? monitorWebcam(candidateId, event.webcamEvent) : false;
  const screenFlag = event.type ? trackScreenActivity(candidateId, event.type) : false;

  if (webcamFlag || screenFlag) {
    const violationType = event.type || event.webcamEvent || "Suspicious activity";
    const warning = issueWarning(candidateId, violationType);

    // If violations exceed threshold, cancel interview
    if (warning.violations >= 2) {
      return cancelInterview(candidateId, `Repeated cheating detected (${violationType})`);
    }

    return {
      status: "warning",
      candidateId,
      violations: warning.violations,
      event: violationType,
      message: `Suspicious behavior detected (${violationType}). Please stay focused on the screen.`
    };
  }

  // No cheating detected
  return null;
}
