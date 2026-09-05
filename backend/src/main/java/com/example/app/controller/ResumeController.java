package com.example.app.controller;

import com.example.app.model.Candidate;
import com.example.app.model.Resume;
import com.example.app.model.User;
import com.example.app.repository.CandidateRepository;
import com.example.app.repository.ResumeRepository;
import com.example.app.repository.UserRepository;
import com.example.app.service.AIService;
import com.example.app.service.FileStorageService;
import com.example.app.service.PdfExtractorService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ResumeController {

    private final FileStorageService fileStorageService;
    private final ResumeRepository resumeRepository;
    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final PdfExtractorService pdfExtractorService;
    private final AIService aiService;

    public ResumeController(
            FileStorageService fileStorageService,
            ResumeRepository resumeRepository,
            CandidateRepository candidateRepository,
            UserRepository userRepository,
            PdfExtractorService pdfExtractorService,
            AIService aiService
    ) {
        this.fileStorageService = fileStorageService;
        this.resumeRepository = resumeRepository;
        this.candidateRepository = candidateRepository;
        this.userRepository = userRepository;
        this.pdfExtractorService = pdfExtractorService;
        this.aiService = aiService;
    }

    // POST /api/resumes/upload → Upload a resume PDF/DOCX
    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file, Authentication authentication) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a valid non-empty file.");
        }

        String email = authentication.getName();
        Candidate candidate = candidateRepository.findByUserEmail(email).orElseGet(() -> {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                Candidate newCand = new Candidate(u, u.getName(), null);
                return candidateRepository.save(newCand);
            }
            return null;
        });

        if (candidate == null) {
            return ResponseEntity.badRequest().body("Candidate account required to upload resume.");
        }

        String storedFileName = fileStorageService.storeFile(file);
        String fileUrl = "/api/resumes/file/" + storedFileName;

        // Extract text and parse with AI
        String rawText = "";
        try {
            Path filePath = fileStorageService.loadFile(storedFileName);
            rawText = pdfExtractorService.extractText(filePath);
        } catch (Exception e) {
            // Ignore error and proceed with filename
        }

        String parsedData = aiService.parseResume(rawText, file.getOriginalFilename());

        Resume resume = new Resume(candidate, fileUrl, parsedData);
        Resume savedResume = resumeRepository.save(resume);

        return ResponseEntity.ok(savedResume);
    }

    // GET /api/resumes/my → List candidate's uploaded resumes
    @GetMapping("/my")
    public ResponseEntity<List<Resume>> getMyResumes(Authentication authentication) {
        String email = authentication.getName();
        List<Resume> resumes = resumeRepository.findByCandidateUserEmailOrderByUploadedAtDesc(email);
        return ResponseEntity.ok(resumes);
    }

    // GET /api/resumes/file/{fileName} → Download / stream resume file
    @GetMapping("/file/{fileName:.+}")
    public ResponseEntity<Resource> getResumeFile(@PathVariable String fileName) {
        try {
            Path filePath = fileStorageService.loadFile(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = "application/pdf";
                if (fileName.endsWith(".docx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
