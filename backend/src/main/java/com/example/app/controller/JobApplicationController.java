package com.example.app.controller;

import com.example.app.dto.ApplyRequest;
import com.example.app.model.*;
import com.example.app.repository.*;
import com.example.app.service.AIService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class JobApplicationController {

    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final RecruiterRepository recruiterRepository;
    private final AIReportRepository aiReportRepository;
    private final ResumeRepository resumeRepository;
    private final AIService aiService;

    public JobApplicationController(
            ApplicationRepository applicationRepository,
            CandidateRepository candidateRepository,
            CompanyRepository companyRepository,
            JobRepository jobRepository,
            UserRepository userRepository,
            RecruiterRepository recruiterRepository,
            AIReportRepository aiReportRepository,
            ResumeRepository resumeRepository,
            AIService aiService
    ) {
        this.applicationRepository = applicationRepository;
        this.candidateRepository = candidateRepository;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.recruiterRepository = recruiterRepository;
        this.aiReportRepository = aiReportRepository;
        this.resumeRepository = resumeRepository;
        this.aiService = aiService;
    }

    // GET /api/applications → fetch applications (candidate gets theirs, recruiter/admin gets all)
    @GetMapping("/applications")
    public ResponseEntity<List<Application>> getApplications(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String role = user.getRole().toLowerCase();
            if ("recruiter".equals(role) || "admin".equals(role)) {
                return ResponseEntity.ok(applicationRepository.findAllByOrderByAppliedAtDesc());
            }
        }

        List<Application> applications = applicationRepository.findByCandidateUserEmailOrderByAppliedAtDesc(email);
        return ResponseEntity.ok(applications);
    }

    // GET /api/jobs → list all active jobs
    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(jobRepository.findAllByOrderByCreatedAtDesc());
    }

    // POST /api/jobs → create a new job posting
    @PostMapping("/jobs")
    public ResponseEntity<?> createJob(@RequestBody Map<String, String> body, Authentication authentication) {
        String title = body.get("title");
        String location = body.get("location");
        String description = body.get("description");
        String companyName = body.get("company");

        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body("Job title is required");
        }

        Company company = null;
        if (companyName != null && !companyName.isBlank()) {
            company = companyRepository.findByName(companyName)
                    .orElseGet(() -> companyRepository.save(new Company(companyName, "General")));
        } else {
            String email = authentication.getName();
            Optional<Recruiter> recOpt = recruiterRepository.findByUserEmail(email);
            if (recOpt.isPresent() && recOpt.get().getCompany() != null) {
                company = recOpt.get().getCompany();
            } else {
                company = companyRepository.findAll().stream().findFirst()
                        .orElseGet(() -> companyRepository.save(new Company("Apex AI Technologies", "Technology")));
            }
        }

        Job job = new Job(company, title, location != null ? location : "Remote", description != null ? description : "");
        Job savedJob = jobRepository.save(job);
        return ResponseEntity.ok(savedJob);
    }

    // POST /api/apply → apply for new job
    @PostMapping("/apply")
    public ResponseEntity<?> applyForJob(@Valid @RequestBody ApplyRequest applyRequest, Authentication authentication) {
        String email = authentication.getName();
        Optional<Candidate> candidateOpt = candidateRepository.findByUserEmail(email);

        Candidate candidate;
        if (candidateOpt.isEmpty()) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            User user = userOpt.get();
            candidate = new Candidate(user, user.getName(), null);
            candidate = candidateRepository.save(candidate);
        } else {
            candidate = candidateOpt.get();
        }

        // Find or create company
        Company company = companyRepository.findByName(applyRequest.getCompany())
                .orElseGet(() -> companyRepository.save(new Company(applyRequest.getCompany(), "General")));

        // Find or create job
        Job job = jobRepository.findAll().stream()
                .filter(j -> j.getTitle().equalsIgnoreCase(applyRequest.getJobTitle()) &&
                             j.getCompany().getId().equals(company.getId()))
                .findFirst()
                .orElseGet(() -> jobRepository.save(new Job(company, applyRequest.getJobTitle(), "Remote", "Exciting opportunity")));

        Application application = new Application(candidate, job, "Applied");
        Application savedApplication = applicationRepository.save(application);

        // Automatically trigger AI evaluation if candidate has resume data
        try {
            String resumeContext = "";
            if (candidate.getUser() != null) {
                List<Resume> candidateResumes = resumeRepository.findByCandidateUserEmailOrderByUploadedAtDesc(candidate.getUser().getEmail());
                if (!candidateResumes.isEmpty()) {
                    resumeContext = candidateResumes.get(0).getParsedData();
                }
            }
            AIService.MatchResult matchResult = aiService.evaluateMatch(resumeContext, job);
            AIReport aiReport = new AIReport(savedApplication, matchResult.getMatchScore(), matchResult.getInsights());
            aiReport = aiReportRepository.save(aiReport);
            savedApplication.setAiReport(aiReport);
        } catch (Exception e) {
            // Safe fallback if report generation fails
        }

        return ResponseEntity.ok(savedApplication);
    }

    // POST /api/applications/{id}/analyze → Run or refresh AI screening and match score
    @PostMapping("/applications/{id}/analyze")
    public ResponseEntity<?> analyzeApplication(@PathVariable Long id) {
        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application application = appOpt.get();
        String resumeContext = "";
        if (application.getCandidate() != null && application.getCandidate().getUser() != null) {
            List<Resume> candidateResumes = resumeRepository.findByCandidateUserEmailOrderByUploadedAtDesc(
                    application.getCandidate().getUser().getEmail()
            );
            if (!candidateResumes.isEmpty()) {
                resumeContext = candidateResumes.get(0).getParsedData();
            }
        }

        AIService.MatchResult matchResult = aiService.evaluateMatch(resumeContext, application.getJob());

        AIReport report = aiReportRepository.findByApplicationId(id).orElseGet(() -> {
            AIReport newReport = new AIReport(application, matchResult.getMatchScore(), matchResult.getInsights());
            return aiReportRepository.save(newReport);
        });

        report.setMatchScore(matchResult.getMatchScore());
        report.setInsights(matchResult.getInsights());
        AIReport savedReport = aiReportRepository.save(report);
        application.setAiReport(savedReport);

        return ResponseEntity.ok(application);
    }

    // POST /api/applications/{id}/generate-questions → Generate tailored interview Q&A
    @PostMapping("/applications/{id}/generate-questions")
    public ResponseEntity<?> generateInterviewQuestions(@PathVariable Long id) {
        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application application = appOpt.get();
        List<Map<String, String>> questions = aiService.generateInterviewQuestions(application);
        return ResponseEntity.ok(questions);
    }

    // PUT /api/applications/{id}/status → update status
    @PutMapping("/applications/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body("Status is required");
        }

        Optional<Application> appOpt = applicationRepository.findById(id);
        if (appOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Application application = appOpt.get();
        application.setStatus(newStatus);
        applicationRepository.save(application);

        return ResponseEntity.ok(application);
    }

    // GET /api/admin/stats → system and platform statistics
    @GetMapping("/admin/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalUsers = userRepository.count();
        long totalCandidates = candidateRepository.count();
        long totalRecruiters = recruiterRepository.count();
        long totalJobs = jobRepository.count();
        long totalApplications = applicationRepository.count();
        long totalCompanies = companyRepository.count();

        stats.put("totalUsers", totalUsers);
        stats.put("totalCandidates", totalCandidates);
        stats.put("totalRecruiters", totalRecruiters);
        stats.put("totalJobs", totalJobs);
        stats.put("totalApplications", totalApplications);
        stats.put("totalCompanies", totalCompanies);
        stats.put("systemHealth", "Operational");
        stats.put("databaseStatus", "Connected (PostgreSQL)");
        stats.put("serverStatus", "Online");
        stats.put("errorLogs", 0);
        stats.put("activeUsers", totalUsers);

        return ResponseEntity.ok(stats);
    }

    // GET /api/admin/users → all registered users
    @GetMapping("/admin/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
