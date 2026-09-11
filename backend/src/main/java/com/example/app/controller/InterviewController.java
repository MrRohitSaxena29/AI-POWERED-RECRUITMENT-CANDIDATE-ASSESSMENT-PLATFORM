package com.example.app.controller;

import com.example.app.model.Application;
import com.example.app.model.Interview;
import com.example.app.repository.ApplicationRepository;
import com.example.app.repository.InterviewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class InterviewController {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;

    public InterviewController(
            InterviewRepository interviewRepository,
            ApplicationRepository applicationRepository
    ) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
    }

    // GET /api/interviews/my → List upcoming interviews
    @GetMapping("/my")
    public ResponseEntity<List<Interview>> getMyInterviews(Authentication authentication) {
        String email = authentication.getName();
        List<Interview> interviews = interviewRepository.findByApplicationCandidateUserEmailOrderByScheduledAtAsc(email);
        return ResponseEntity.ok(interviews);
    }

    // GET /api/interviews/all → List all interviews for recruiters
    @GetMapping("/all")
    public ResponseEntity<List<Interview>> getAllInterviews() {
        return ResponseEntity.ok(interviewRepository.findAllByOrderByScheduledAtAsc());
    }

    // POST /api/interviews/schedule → Schedule an interview for an application
    @PostMapping("/schedule")
    public ResponseEntity<?> scheduleInterview(@RequestBody Map<String, Object> body) {
        if (!body.containsKey("applicationId")) {
            return ResponseEntity.badRequest().body("applicationId is required");
        }

        Long applicationId = Long.valueOf(body.get("applicationId").toString());
        Optional<Application> appOpt = applicationRepository.findById(applicationId);

        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application application = appOpt.get();

        Interview interview = interviewRepository.findByApplicationId(applicationId)
                .orElse(new Interview(application, "Scheduled"));

        if (body.containsKey("scheduledAt")) {
            interview.setScheduledAt(LocalDateTime.parse(body.get("scheduledAt").toString()));
        } else {
            interview.setScheduledAt(LocalDateTime.now().plusDays(2));
        }

        if (body.containsKey("feedback")) {
            interview.setFeedback(body.get("feedback").toString());
        }

        interview.setStatus("Scheduled");
        Interview savedInterview = interviewRepository.save(interview);

        // Update application stage automatically
        application.setStatus("Interview Scheduled");
        applicationRepository.save(application);

        return ResponseEntity.ok(savedInterview);
    }

    // PUT /api/interviews/{id}/feedback → update status and feedback notes
    @PutMapping("/{id}/feedback")
    public ResponseEntity<?> updateInterviewFeedback(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Interview> interviewOpt = interviewRepository.findById(id);
        if (interviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Interview interview = interviewOpt.get();
        if (body.containsKey("status")) {
            interview.setStatus(body.get("status"));
        }
        if (body.containsKey("feedback")) {
            interview.setFeedback(body.get("feedback"));
        }

        Interview saved = interviewRepository.save(interview);
        return ResponseEntity.ok(saved);
    }

    // POST /api/interviews/{id}/start → Start an interview session
    @PostMapping("/{id}/start")
    public ResponseEntity<?> startInterviewSession(@PathVariable Long id) {
        Optional<Interview> interviewOpt = interviewRepository.findById(id);
        if (interviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Interview interview = interviewOpt.get();
        interview.setStatus("In Progress");
        interview.setViolationsCount(0);
        interview.setFlaggedCheating(false);
        String startLog = "[" + LocalDateTime.now() + "] Interview session started under ACSS Proctoring.\n";
        interview.setCheatingLogs(startLog);

        Interview saved = interviewRepository.save(interview);

        Application application = interview.getApplication();
        if (application != null) {
            application.setStatus("In Progress");
            applicationRepository.save(application);
        }

        return ResponseEntity.ok(saved);
    }

    // POST /api/interviews/{id}/activity → Process ACSS anti-cheating activity/violation
    @PostMapping("/{id}/activity")
    public ResponseEntity<?> processInterviewActivity(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Interview> interviewOpt = interviewRepository.findById(id);
        if (interviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Interview interview = interviewOpt.get();
        String eventType = body.containsKey("event") ? body.get("event").toString() : "Suspicious activity";
        String details = body.containsKey("details") ? body.get("details").toString() : "";

        int currentViolations = (interview.getViolationsCount() != null ? interview.getViolationsCount() : 0) + 1;
        interview.setViolationsCount(currentViolations);

        String currentLogs = interview.getCheatingLogs() != null ? interview.getCheatingLogs() : "";
        String newEntry = "[" + LocalDateTime.now() + "] Violation #" + currentViolations + ": " + eventType + (details.isEmpty() ? "" : " (" + details + ")") + "\n";
        interview.setCheatingLogs(currentLogs + newEntry);

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("interviewId", id);
        response.put("violations", currentViolations);
        response.put("event", eventType);

        // Auto-cancellation threshold: 2 violations
        if (currentViolations >= 2) {
            interview.setStatus("Cancelled");
            interview.setFlaggedCheating(true);
            interview.setCheatingLogs(interview.getCheatingLogs() + "[" + LocalDateTime.now() + "] AUTO-CANCELLED: Cheating detected multiple times. Terminating session.\n");

            Application application = interview.getApplication();
            if (application != null) {
                application.setStatus("Interview Cancelled (Cheating Detected)");
                applicationRepository.save(application);
            }

            response.put("status", "cancelled");
            response.put("reason", "Cheating detected multiple times under ACSS proctoring");
            response.put("message", "Interview terminated due to repeated anti-cheating violations.");
        } else {
            response.put("status", "warning");
            response.put("message", "Suspicious behavior detected. Warning issued. Please stay focused.");
        }

        interviewRepository.save(interview);
        return ResponseEntity.ok(response);
    }

    // POST /api/interviews/{id}/end → Candidate completes interview
    @PostMapping("/{id}/end")
    public ResponseEntity<?> endInterviewSession(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Optional<Interview> interviewOpt = interviewRepository.findById(id);
        if (interviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Interview interview = interviewOpt.get();
        interview.setStatus("Completed");

        String endLog = "[" + LocalDateTime.now() + "] Interview completed successfully by candidate.\n";
        interview.setCheatingLogs((interview.getCheatingLogs() != null ? interview.getCheatingLogs() : "") + endLog);

        if (body != null && body.containsKey("feedback")) {
            interview.setFeedback(body.get("feedback").toString());
        }

        Interview saved = interviewRepository.save(interview);

        Application application = interview.getApplication();
        if (application != null) {
            application.setStatus("Assessment Completed");
            applicationRepository.save(application);
        }

        return ResponseEntity.ok(saved);
    }

    // POST /api/interviews/{id}/cancel → Recruiter / Admin force cancel
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> forceCancelInterviewSession(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        Optional<Interview> interviewOpt = interviewRepository.findById(id);
        if (interviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Interview interview = interviewOpt.get();
        interview.setStatus("Cancelled");
        interview.setFlaggedCheating(true);

        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Recruiter override";
        String cancelLog = "[" + LocalDateTime.now() + "] CANCELLED BY RECRUITER/ADMIN. Reason: " + reason + "\n";
        interview.setCheatingLogs((interview.getCheatingLogs() != null ? interview.getCheatingLogs() : "") + cancelLog);

        Interview saved = interviewRepository.save(interview);

        Application application = interview.getApplication();
        if (application != null) {
            application.setStatus("Interview Cancelled");
            applicationRepository.save(application);
        }

        return ResponseEntity.ok(saved);
    }

    // GET /api/interviews/{id}/logs → Get violation logs for an interview
    @GetMapping("/{id}/logs")
    public ResponseEntity<?> getInterviewLogs(@PathVariable Long id) {
        Optional<Interview> interviewOpt = interviewRepository.findById(id);
        if (interviewOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Interview interview = interviewOpt.get();
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("interviewId", interview.getId());
        result.put("status", interview.getStatus());
        result.put("violationsCount", interview.getViolationsCount());
        result.put("flaggedCheating", interview.getFlaggedCheating());
        result.put("logs", interview.getCheatingLogs());

        return ResponseEntity.ok(result);
    }

    // GET /api/interviews/admin/cheating-logs → Admin view of all flagged interviews
    @GetMapping("/admin/cheating-logs")
    public ResponseEntity<List<Interview>> getAdminCheatingLogs() {
        List<Interview> flagged = interviewRepository.findByFlaggedCheatingTrue();
        return ResponseEntity.ok(flagged);
    }
}
