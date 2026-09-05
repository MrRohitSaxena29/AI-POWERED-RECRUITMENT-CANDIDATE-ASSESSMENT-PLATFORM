package com.example.app;

import com.example.app.model.Company;
import com.example.app.model.Job;
import com.example.app.model.User;
import com.example.app.repository.CompanyRepository;
import com.example.app.repository.JobRepository;
import com.example.app.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class RecruitmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecruitmentApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDatabase(
            UserRepository userRepository,
            CompanyRepository companyRepository,
            JobRepository jobRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // Seed Admin User
            if (!userRepository.existsByEmail("admin@recruitment.com")) {
                User admin = new User("admin@recruitment.com", passwordEncoder.encode("admin123"), "admin");
                userRepository.save(admin);
            }

            // Seed Recruiter User
            if (!userRepository.existsByEmail("recruiter@recruitment.com")) {
                User recruiter = new User("recruiter@recruitment.com", passwordEncoder.encode("recruiter123"), "recruiter");
                userRepository.save(recruiter);
            }

            // Seed Candidate User
            if (!userRepository.existsByEmail("candidate@recruitment.com")) {
                User candidate = new User("candidate@recruitment.com", passwordEncoder.encode("candidate123"), "candidate");
                userRepository.save(candidate);
            }

            // Seed Default Company and sample Jobs if empty
            if (companyRepository.count() == 0) {
                Company apex = companyRepository.save(new Company("Apex AI Technologies", "Artificial Intelligence & Cloud"));
                Company cloudTech = companyRepository.save(new Company("CloudWave Systems", "Enterprise Software"));

                jobRepository.save(new Job(apex, "Senior Full Stack Java Engineer", "Remote", "Looking for 4+ years of Java, Spring Boot, React, and PostgreSQL experience."));
                jobRepository.save(new Job(apex, "AI / ML Research Engineer", "Bangalore, India", "Experience with Python, LLMs, NLP, and model evaluation pipeline."));
                jobRepository.save(new Job(cloudTech, "Frontend React Developer", "Remote", "Strong knowledge of modern React, Tailwind CSS, JavaScript ES6+, REST APIs."));
            }
        };
    }
}
