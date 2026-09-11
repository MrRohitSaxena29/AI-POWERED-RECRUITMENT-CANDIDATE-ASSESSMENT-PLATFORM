import express from "express";
import cors from "cors";
import interviewRoutes from "./interview/interviewRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ACSS Interview Surveillance Routes
app.use("/api/interview", interviewRoutes);

app.get("/health", (req, res) => {
  res.json({
    service: "ACSS - Anti-Cheating Surveillance System",
    status: "healthy",
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`[ACSS] Anti-Cheating Surveillance System running on port ${PORT}`);
});
