/**
 * Check a webcam signal supplied by the webcam/ML integration.
 * @param {string} candidateId - Candidate ID used for diagnostics
 * @param {string} event - Webcam signal (e.g., "gazeAway")
 * @returns {boolean} - True when the supplied signal is suspicious
 */
export function monitorWebcam(candidateId, event) {
  const suspiciousEvents = ["gazeAway", "multipleFaces", "noFaceDetected"];

  if (suspiciousEvents.includes(event)) {
    console.warn(`Suspicious webcam activity detected for ${candidateId}: ${event}`);
    return true;
  }

  return false;
}