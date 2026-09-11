// behaviorAnalyzer.js

import { monitorWebcam } from "./webcamMonitor.js";
import { trackScreenActivity } from "./screenTracker.js";
import { issueWarning } from "./warningHandler.js";
import { cancelInterview } from "./autoCancel.js";

/**
 * Analyze candidate behavior during the interview.
 * Combines webcam + screen tracking signals to detect cheating.
 * @param {string} candidateId - Unique identifier for the candidate
 * @param {object} event - Event object (e.g., { type: "tabSwitch" })
 * @returns {object|null} - Action result (warning or cancellation), or null if no cheating
 */
export function analyzeBehavior(candidateId, event = {}) {
  const webcamFlag = monitorWebcam(candidateId, event.webcamEvent);
  const screenFlag = trackScreenActivity(candidateId, event.type);

  if (webcamFlag || screenFlag) {
    const warning = issueWarning(
      candidateId,
      event.type || event.webcamEvent || "Suspicious activity"
    );

    // If violations exceed threshold, cancel interview
    if (warning.violations >= 2) {
      return cancelInterview(candidateId, "Cheating detected multiple times");
    }

    return {
      status: "warning",
      candidateId,
      violations: warning.violations,
      message: "Suspicious behavior detected. Please stay focused."
    };
  }

  // No cheating detected
  return null;
}
