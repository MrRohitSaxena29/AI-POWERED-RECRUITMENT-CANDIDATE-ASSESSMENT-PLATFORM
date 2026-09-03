package com.example.app.config;

import com.example.app.model.*;
import com.example.app.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final RecruiterRepository recruiterRepository;
    private final CompanyRepository companyRepository;
    private final SkillRepository skillRepository;
    private final JobRepository jobRepository;
    private final JobSkillRepository jobSkillRepository;
    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;
    private final AssessmentRepository assessmentRepository;
    private final InterviewRepository interviewRepository;
    private final AIReportRepository aiReportRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            CandidateRepository candidateRepository,
            RecruiterRepository recruiterRepository,
            CompanyRepository companyRepository,
            SkillRepository skillRepository,
            JobRepository jobRepository,
            JobSkillRepository jobSkillRepository,
            ResumeRepository resumeRepository,
            ApplicationRepository applicationRepository,
            AssessmentRepository assessmentRepository,
            InterviewRepository interviewRepository,
            AIReportRepository aiReportRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.candidateRepository = candidateRepository;
        this.recruiterRepository = recruiterRepository;
        this.companyRepository = companyRepository;
        this.skillRepository = skillRepository;
        this.jobRepository = jobRepository;
        this.jobSkillRepository = jobSkillRepository;
        this.resumeRepository = resumeRepository;
        this.applicationRepository = applicationRepository;
        this.assessmentRepository = assessmentRepository;
        this.interviewRepository = interviewRepository;
        this.aiReportRepository = aiReportRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Seed Skills
        Skill javaSkill = getOrCreateSkill("Java");
        Skill springSkill = getOrCreateSkill("Spring Boot");
        Skill reactSkill = getOrCreateSkill("React");
        Skill postgresSkill = getOrCreateSkill("PostgreSQL");
        Skill aiSkill = getOrCreateSkill("GenAI / LLMs");

        // 2. Seed Admin User
        if (!userRepository.existsByEmail("admin@recruitment.com")) {
            User admin = new User("admin@recruitment.com", passwordEncoder.encode("admin123"), "admin");
            userRepository.save(admin);
            log.info("Seeded default ADMIN: admin@recruitment.com / admin123");
        }

        // 3. Seed Company
        Company company = companyRepository.findByName("Apex AI Technologies")
                .orElseGet(() -> companyRepository.save(new Company("Apex AI Technologies", "Artificial Intelligence & Enterprise Software")));

        // 4. Seed Recruiter
        if (!userRepository.existsByEmail("recruiter@recruitment.com")) {
            User recUser = new User("recruiter@recruitment.com", passwordEncoder.encode("recruiter123"), "recruiter");
            User savedRecUser = userRepository.save(recUser);
            Recruiter recruiter = new Recruiter(savedRecUser, company, "Jane Recruiter", "+1-555-0100");
            recruiterRepository.save(recruiter);
            log.info("Seeded default RECRUITER: recruiter@recruitment.com / recruiter123 at Apex AI Technologies");
        }

        // 5. Seed Candidate
        Candidate candidate;
        if (!userRepository.existsByEmail("candidate@recruitment.com")) {
            User candUser = new User("candidate@recruitment.com", passwordEncoder.encode("candidate123"), "candidate");
            User savedCandUser = userRepository.save(candUser);
            candidate = new Candidate(savedCandUser, "Rohit Candidate", "+1-555-0199");
            candidate = candidateRepository.save(candidate);
            log.info("Seeded default CANDIDATE: candidate@recruitment.com / candidate123");

            // Seed sample Resume
            Resume resume = new Resume(
                    candidate,
                    "https://storage.example.com/resumes/rohit_candidate_cv.pdf",
                    "{\"skills\": [\"Java\", \"Spring Boot\", \"React\", \"PostgreSQL\"], \"experience_years\": 4, \"summary\": \"Full Stack Engineer with strong backend expertise.\"}"
            );
            resumeRepository.save(resume);
        } else {
            candidate = candidateRepository.findByUserEmail("candidate@recruitment.com").orElse(null);
        }

        // 6. Seed Jobs
        Job job1 = jobRepository.findAll().stream()
                .filter(j -> j.getTitle().equals("Senior Full-Stack Engineer"))
                .findFirst()
                .orElseGet(() -> {
                    Job j = new Job(company, "Senior Full-Stack Engineer", "San Francisco, CA / Remote", "Looking for senior full-stack talent in Spring Boot & React.");
                    j = jobRepository.save(j);
                    jobSkillRepository.save(new JobSkill(j, javaSkill, true));
                    jobSkillRepository.save(new JobSkill(j, springSkill, true));
                    jobSkillRepository.save(new JobSkill(j, reactSkill, true));
                    jobSkillRepository.save(new JobSkill(j, postgresSkill, false));
                    return j;
                });

        Job job2 = jobRepository.findAll().stream()
                .filter(j -> j.getTitle().equals("AI Systems Architect"))
                .findFirst()
                .orElseGet(() -> {
                    Job j = new Job(company, "AI Systems Architect", "New York, NY / Hybrid", "Architecting enterprise AI pipelines.");
                    j = jobRepository.save(j);
                    jobSkillRepository.save(new JobSkill(j, aiSkill, true));
                    jobSkillRepository.save(new JobSkill(j, javaSkill, true));
                    return j;
                });

        // 7. Seed Sample Application with Assessment, Interview, AIReport
        if (candidate != null && applicationRepository.findByCandidateIdOrderByAppliedAtDesc(candidate.getId()).isEmpty()) {
            Application app = new Application(candidate, job1, "Interview Scheduled");
            app = applicationRepository.save(app);

            Assessment assessment = new Assessment(app, 92.5);
            assessment.setDetails("Passed full-stack algorithmic and system design assessment with distinction.");
            assessmentRepository.save(assessment);

            Interview interview = new Interview(app, "Scheduled");
            interview.setFeedback("Preliminary screening passed. Technical round scheduled.");
            interviewRepository.save(interview);

            AIReport aiReport = new AIReport(app, 88.0, "High match score based on extracted resume skills (Java, Spring Boot, React) aligning with job requirements.");
            aiReportRepository.save(aiReport);

            log.info("Seeded complete end-to-end Application pipeline (Candidate, Job, Assessment, Interview, AIReport)");
        }
    }

    private Skill getOrCreateSkill(String name) {
        return skillRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> skillRepository.save(new Skill(name)));
    }
}
