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
}
