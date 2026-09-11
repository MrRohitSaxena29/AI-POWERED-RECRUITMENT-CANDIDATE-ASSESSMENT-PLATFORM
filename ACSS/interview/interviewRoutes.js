// interviewRoutes.js

import express from "express";
import {
  startInterview,
  handleActivity,
  endInterview,
  forceCancelInterview
} from "./interviewController.js";

const router = express.Router();

function sendResult(res, result) {
  return res.status(result.status === "error" ? 400 : 200).json(result);
}

/**
 * Start interview route
 * POST /interview/start
 */
router.post("/start", (req, res) => {
  const { candidateId } = req.body;
  if (typeof candidateId !== "string" || candidateId.trim() === "") {
    return sendResult(res, { status: "error", message: "candidateId is required" });
  }
  return sendResult(res, startInterview(candidateId.trim()));
});

/**
 * Handle candidate activity
 * POST /interview/activity
 */
router.post("/activity", (req, res) => {
  const { candidateId, event } = req.body;
  if (typeof candidateId !== "string" || candidateId.trim() === "" || !event || typeof event !== "object") {
    return sendResult(res, { status: "error", message: "candidateId and event are required" });
  }
  return sendResult(res, handleActivity(candidateId.trim(), event));
});

/**
 * End interview route
 * POST /interview/end
 */
router.post("/end", (req, res) => {
  const { candidateId } = req.body;
  if (typeof candidateId !== "string" || candidateId.trim() === "") {
    return sendResult(res, { status: "error", message: "candidateId is required" });
  }
  return sendResult(res, endInterview(candidateId.trim()));
});

/**
 * Force cancel interview (recruiter override)
 * POST /interview/cancel
 */
router.post("/cancel", (req, res) => {
  const { candidateId } = req.body;
  if (typeof candidateId !== "string" || candidateId.trim() === "") {
    return sendResult(res, { status: "error", message: "candidateId is required" });
  }
  return sendResult(res, forceCancelInterview(candidateId.trim()));
});

export default router;
