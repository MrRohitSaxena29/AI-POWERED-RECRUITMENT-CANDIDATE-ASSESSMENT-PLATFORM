// index.js

// Export individual modules for easy integration
export { monitorWebcam } from "./webcamMonitor.js";
export { trackScreenActivity } from "./screenTracker.js";
export { issueWarning, getViolations } from "./warningHandler.js";
export { cancelInterview } from "./autoCancel.js";
export { logViolation, getLogs } from "./logsManager.js";
export { analyzeBehavior } from "./behaviorAnalyzer.js";
