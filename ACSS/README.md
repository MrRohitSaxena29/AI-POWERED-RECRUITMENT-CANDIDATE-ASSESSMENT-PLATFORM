# ACSS — Anti-Cheating Surveillance System

The Anti-Cheating Surveillance System (ACSS) is an automated proctoring and security subsystem embedded within the AI-Powered Recruitment and Candidate Assessment Platform.

---

## 🎯 Key Capabilities

1. **Screen & Tab Activity Tracking (`anticheating/screenTracker.js`)**:
   - Detects `tabSwitch` via the HTML5 Page Visibility API (`document.visibilitychange`).
   - Detects `focusLost` and `windowMinimize` via window blur events (`window.onblur`).

2. **Webcam & Proctoring Signal Analysis (`anticheating/webcamMonitor.js`)**:
   - Monitors for `gazeAway` (candidate looking away from the screen for prolonged periods).
   - Detects `multipleFaces` (presence of unauthorized third parties).
   - Detects `noFaceDetected` (candidate left the assessment station).

3. **Behavioral Evaluation & Auto-Cancellation (`anticheating/behaviorAnalyzer.js`, `autoCancel.js`)**:
   - **Strike 1 (Warning)**: Displays a prominent warning modal, sound/visual alert, and records the timestamped audit log.
   - **Strike 2 (Auto-Cancellation)**: Immediately terminates the candidate's interview session, releases the camera stream, and locks the application stage as `Interview Cancelled (Cheating Detected)`.

4. **Recruiter & Admin Auditing (`logsManager.js`, Recruiter & Admin Portals)**:
   - Recruiter can review candidate proctoring audit trails and trigger manual force termination.
   - Admin command center provides real-time in-browser and database-backed surveillance telemetry.

---

## 🏗️ Integration Structure

- **Frontend Core**: `recruitment-frontend/src/acss/`
  - `anticheating/`: Monitoring modules, warning handler, and behavior analyzer.
  - `interview/`: Session lifecycle management (`startSession`, `processActivity`, `endSession`, `forceCancel`).
  - `components/ProctoredInterviewModal.js`: Live proctored interview room with webcam feed, real-time ACSS HUD, violation progress bar, and question assessment workspace.
- **Backend Core**: `backend/src/main/java/com/example/app/`
  - `Interview.java`: Persists `violationsCount`, `flaggedCheating`, and `cheatingLogs`.
  - `InterviewController.java`: Exposes `/api/interviews/{id}/start`, `/activity`, `/end`, `/cancel`, `/logs`, and `/admin/cheating-logs`.
- **Standalone Microservice (Optional)**: `ACSS/server.js`
  - Express-based runner for running ACSS as an independent microservice on port 5001.
