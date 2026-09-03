package com.example.app.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.app.model.Candidate;
import com.example.app.model.Resume;
import com.example.app.model.User;
import com.example.app.repository.ApplicationRepository;
import com.example.app.repository.CandidateRepository;
import com.example.app.repository.ResumeRepository;
import com.example.app.repository.UserRepository;

@RestController
@RequestMapping("/api/candidate")
@CrossOrigin(origins = {"http://localhost:3000", "http://10.118.127.53:3000"}, allowCredentials = "true")
public class CandidateProfileController {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ApplicationRepository applicationRepository;

    public CandidateProfileController(
            CandidateRepository candidateRepository,
            UserRepository userRepository,
            ResumeRepository resumeRepository,
            ApplicationRepository applicationRepository
    ) {
        this.candidateRepository = candidateRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.applicationRepository = applicationRepository;
    }

    // GET /api/candidate/profile → get candidate profile details
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String email = authentication.getName();
        Optional<Candidate> candidateOpt = candidateRepository.findByUserEmail(email);

        Candidate candidate;
        if (candidateOpt.isEmpty()) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            User u = userOpt.get();
            candidate = candidateRepository.save(new Candidate(u, u.getName(), null));
        } else {
            candidate = candidateOpt.get();
        }

        List<Resume> resumes = resumeRepository.findByCandidateIdOrderByUploadedAtDesc(candidate.getId());
        long applicationCount = applicationRepository.findByCandidateIdOrderByAppliedAtDesc(candidate.getId()).size();

        Map<String, Object> response = new HashMap<>();
        response.put("id", candidate.getId());
        response.put("name", candidate.getName());
        response.put("email", email);
        response.put("phone", candidate.getPhone());
        response.put("resumes", resumes);
        response.put("totalApplications", applicationCount);

        return ResponseEntity.ok(response);
    }

    // PUT /api/candidate/profile → update candidate profile info
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates, Authentication authentication) {
        String email = authentication.getName();
        Optional<Candidate> candidateOpt = candidateRepository.findByUserEmail(email);

        if (candidateOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Candidate candidate = candidateOpt.get();
        if (updates.containsKey("name") && !updates.get("name").isBlank()) {
            candidate.setName(updates.get("name"));
        }
        if (updates.containsKey("phone")) {
            candidate.setPhone(updates.get("phone"));
        }

        Candidate updated = candidateRepository.save(candidate);
        return ResponseEntity.ok(updated);
    }
}
