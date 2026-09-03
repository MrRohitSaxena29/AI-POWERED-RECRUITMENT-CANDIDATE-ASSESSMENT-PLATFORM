package com.example.app.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app.model.Application;
import com.example.app.model.Assessment;
import com.example.app.repository.ApplicationRepository;
import com.example.app.repository.AssessmentRepository;

@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = {"http://localhost:3000", "http://10.118.127.53:3000"}, allowCredentials = "true")
public class AssessmentController {

    private final AssessmentRepository assessmentRepository;
    private final ApplicationRepository applicationRepository;

    public AssessmentController(
            AssessmentRepository assessmentRepository,
            ApplicationRepository applicationRepository
    ) {
        this.assessmentRepository = assessmentRepository;
        this.applicationRepository = applicationRepository;
    }

    // GET /api/assessments/application/{applicationId} → Fetch assessment details
    @GetMapping("/application/{applicationId}")
    public ResponseEntity<?> getAssessmentByApplication(@PathVariable Long applicationId) {
        Optional<Assessment> assessmentOpt = assessmentRepository.findByApplicationId(applicationId);
        if (assessmentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(assessmentOpt.get());
    }

    // POST /api/assessments/application/{applicationId}/submit → Submit test scores and details
    @PostMapping("/application/{applicationId}/submit")
    public ResponseEntity<?> submitAssessment(
            @PathVariable Long applicationId,
            @RequestBody Map<String, Object> body
    ) {
        Optional<Application> appOpt = applicationRepository.findById(applicationId);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application application = appOpt.get();
        Double score = 0.0;
        if (body.containsKey("score")) {
            score = Double.valueOf(body.get("score").toString());
        }

        String details = body.getOrDefault("details", "Assessment submitted online.").toString();

        Assessment assessment = assessmentRepository.findByApplicationId(applicationId)
                .orElse(new Assessment(application, score));

        assessment.setScore(score);
        assessment.setDetails(details);
        assessment.setCompletedAt(LocalDateTime.now());

        Assessment saved = assessmentRepository.save(assessment);

        // Update application stage if score is passing (>= 70)
        if (score >= 70.0 && "Applied".equals(application.getStatus())) {
            application.setStatus("Screening");
            applicationRepository.save(application);
        }

        return ResponseEntity.ok(saved);
    }
}
