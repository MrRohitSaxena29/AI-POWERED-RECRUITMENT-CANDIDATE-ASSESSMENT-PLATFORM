package com.example.app.service;

import com.example.app.model.Application;
import com.example.app.model.Job;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    // Comprehensive skills taxonomy for local fallback extraction
    private static final List<String> KNOWN_SKILLS = List.of(
            "Java", "Spring Boot", "Spring", "Hibernate", "JPA", "PostgreSQL", "MySQL", "MongoDB", "Redis",
            "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Express", "HTML", "CSS", "Tailwind CSS",
            "Python", "Django", "FastAPI", "Flask", "C++", "C#", ".NET", "Go", "Golang", "Rust",
            "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Google Cloud", "CI/CD", "Git", "GitHub", "Linux",
            "REST API", "GraphQL", "Microservices", "Kafka", "RabbitMQ", "Machine Learning", "AI", "NLP",
            "JUnit", "Mockito", "Jest", "Agile", "Scrum", "SQL"
    );

    public AIService(GeminiClient geminiClient, ObjectMapper objectMapper) {
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    public static class MatchResult {
        private final double matchScore;
        private final String insights;
        private final List<String> matchingSkills;
        private final List<String> gapSkills;

        public MatchResult(double matchScore, String insights, List<String> matchingSkills, List<String> gapSkills) {
            this.matchScore = Math.round(matchScore * 10.0) / 10.0;
            this.insights = insights;
            this.matchingSkills = matchingSkills != null ? matchingSkills : Collections.emptyList();
            this.gapSkills = gapSkills != null ? gapSkills : Collections.emptyList();
        }

        public double getMatchScore() {
            return matchScore;
        }

        public String getInsights() {
            return insights;
        }

        public List<String> getMatchingSkills() {
            return matchingSkills;
        }

        public List<String> getGapSkills() {
            return gapSkills;
        }
    }

    /**
     * Parses raw resume text into structured JSON metadata.
     */
    public String parseResume(String rawText, String fileName) {
        if (rawText == null || rawText.isBlank()) {
            return createDefaultParsedData(fileName, Collections.emptyList());
        }

        // Try Gemini if available
        if (geminiClient.isConfigured()) {
            try {
                String prompt = """
                        You are an expert HR resume parser. Extract structured information from the following resume text.
                        Return ONLY a JSON object with this exact structure:
                        {
                          "skills": ["Skill1", "Skill2", ...],
                          "yearsOfExperience": "e.g. 3+ years",
                          "education": "e.g. B.Tech in Computer Science",
                          "summary": "2 sentence professional profile summary",
                          "domain": "e.g. Full Stack Development / Cloud / Data"
                        }
                        Resume Text:
                        """ + truncate(rawText, 4000);

                String jsonResponse = geminiClient.generateJson(prompt);
                if (jsonResponse != null && !jsonResponse.isBlank()) {
                    JsonNode node = objectMapper.readTree(jsonResponse);
                    Map<String, Object> result = new HashMap<>();
                    result.put("filename", fileName);
                    result.put("skills", objectMapper.convertValue(node.path("skills"), new TypeReference<List<String>>() {}));
                    result.put("yearsOfExperience", node.path("yearsOfExperience").asText("Not specified"));
                    result.put("education", node.path("education").asText("Not specified"));
                    result.put("summary", node.path("summary").asText("Profile parsed with Gemini AI."));
                    result.put("domain", node.path("domain").asText("Software Engineering"));
                    result.put("aiEngine", "Gemini 2.5 Flash");
                    return objectMapper.writeValueAsString(result);
                }
            } catch (Exception e) {
                log.warn("Gemini resume parsing failed, using built-in NLP parser: {}", e.getMessage());
            }
        }

        // Built-in intelligent NLP fallback parser
        List<String> detectedSkills = extractSkillsFromText(rawText);
        String experience = estimateExperience(rawText);
        String education = estimateEducation(rawText);

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("filename", fileName);
        fallback.put("skills", detectedSkills);
        fallback.put("yearsOfExperience", experience);
        fallback.put("education", education);
        fallback.put("summary", "Technical candidate with demonstrated skills in " +
                String.join(", ", detectedSkills.stream().limit(5).toList()) + ".");
        fallback.put("aiEngine", "Intelligent NLP Engine");

        try {
            return objectMapper.writeValueAsString(fallback);
        } catch (Exception e) {
            return createDefaultParsedData(fileName, detectedSkills);
        }
    }

    /**
     * Evaluates the candidate's resume/skills against a Job to produce a match score and actionable insights.
     */
    public MatchResult evaluateMatch(String resumeTextOrParsedData, Job job) {
        String jobTitle = job.getTitle() != null ? job.getTitle() : "Software Engineer";
        String jobDesc = job.getDescription() != null ? job.getDescription() : "";
        List<String> candidateSkills = extractSkillsFromJsonOrText(resumeTextOrParsedData);

        // Try Gemini if available
        if (geminiClient.isConfigured()) {
            try {
                String prompt = String.format("""
                        You are an AI recruitment evaluator. Evaluate this candidate for the given job.
                        Job Title: %s
                        Job Description: %s
                        Candidate Skills & Resume Data: %s
                        
                        Evaluate how well the candidate matches the requirements.
                        Return ONLY a JSON object with this exact structure:
                        {
                          "matchScore": <number between 40 and 98 representing match percentage>,
                          "insights": "<concise 2-3 sentence assessment describing technical fit, strengths, and recommendations>",
                          "matchingSkills": ["<skill1>", "<skill2>"],
                          "gapSkills": ["<missing skill1>", "<missing skill2>"]
                        }
                        """, jobTitle, truncate(jobDesc, 1000), truncate(resumeTextOrParsedData, 2000));

                String jsonResponse = geminiClient.generateJson(prompt);
                if (jsonResponse != null && !jsonResponse.isBlank()) {
                    JsonNode node = objectMapper.readTree(jsonResponse);
                    double score = node.path("matchScore").asDouble(75.0);
                    String insights = node.path("insights").asText("Strong candidate profile matching technical requirements.");
                    List<String> matching = objectMapper.convertValue(node.path("matchingSkills"), new TypeReference<List<String>>() {});
                    List<String> gaps = objectMapper.convertValue(node.path("gapSkills"), new TypeReference<List<String>>() {});
                    return new MatchResult(score, insights, matching, gaps);
                }
            } catch (Exception e) {
                log.warn("Gemini evaluation failed, using built-in semantic matching: {}", e.getMessage());
            }
        }

        // Built-in Semantic Matcher
        List<String> jobSkills = extractSkillsFromText(jobTitle + " " + jobDesc);
        if (jobSkills.isEmpty()) {
            jobSkills = List.of("Java", "Spring Boot", "SQL", "REST API", "Git");
        }

        Set<String> candidateSkillSet = candidateSkills.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        List<String> matching = new ArrayList<>();
        List<String> gaps = new ArrayList<>();

        for (String reqSkill : jobSkills) {
            if (candidateSkillSet.contains(reqSkill.toLowerCase())) {
                matching.add(reqSkill);
            } else {
                gaps.add(reqSkill);
            }
        }

        // Scoring algorithm:
        // Base score: 50.0 + (ratio * 40.0) + title keyword boost
        double ratio = (double) matching.size() / Math.max(jobSkills.size(), 1);
        double score = 52.0 + (ratio * 38.0);

        // Title alignment boost
        for (String word : jobTitle.split("\\s+")) {
            if (word.length() > 3 && candidateSkillSet.contains(word.toLowerCase())) {
                score += 5.0;
            }
        }
        score = Math.min(Math.max(score, 45.0), 96.0);

        String insights;
        if (matching.isEmpty()) {
            insights = String.format("Candidate possesses relevant software engineering background. Recommended to assess depth in %s for %s role.",
                    String.join(", ", gaps.stream().limit(3).toList()), jobTitle);
        } else {
            insights = String.format("Strong candidate alignment in %s (%d matching competencies). Meets core job qualifications for %s. Suggested evaluation in %s.",
                    String.join(", ", matching.stream().limit(4).toList()),
                    matching.size(),
                    jobTitle,
                    gaps.isEmpty() ? "system design" : String.join(", ", gaps.stream().limit(2).toList()));
        }

        return new MatchResult(score, insights, matching, gaps);
    }

    /**
     * Generates customized technical and behavioral interview questions for an application.
     */
    public List<Map<String, String>> generateInterviewQuestions(Application application) {
        String jobTitle = application.getJobTitle() != null ? application.getJobTitle() : "Software Engineer";
        String jobDesc = application.getJob() != null ? application.getJob().getDescription() : "";
        String candidateName = application.getCandidate() != null ? application.getCandidate().getName() : "Candidate";

        // Try Gemini if available
        if (geminiClient.isConfigured()) {
            try {
                String prompt = String.format("""
                        You are an expert technical interviewer. Generate 5 tailored interview questions for:
                        Candidate: %s
                        Job Role: %s
                        Job Context: %s
                        
                        Return ONLY a JSON array of 5 objects with this structure:
                        [
                          {
                            "category": "Technical / System Architecture / Behavioral / Problem Solving",
                            "question": "The interview question",
                            "expectedCriteria": "Key indicators of a strong answer"
                          }
                        ]
                        """, candidateName, jobTitle, truncate(jobDesc, 800));

                String jsonResponse = geminiClient.generateJson(prompt);
                if (jsonResponse != null && !jsonResponse.isBlank()) {
                    return objectMapper.readValue(jsonResponse, new TypeReference<List<Map<String, String>>>() {});
                }
            } catch (Exception e) {
                log.warn("Gemini interview question generation failed: {}", e.getMessage());
            }
        }

        // Built-in intelligent question generator
        List<Map<String, String>> questions = new ArrayList<>();

        questions.add(Map.of(
                "category", "Technical Architecture",
                "question", String.format("How would you architect a scalable backend service using microservices for a platform like %s?", jobTitle),
                "expectedCriteria", "Mentions service decoupling, database per service, caching strategies (Redis), and idempotent RESTful endpoints."
        ));

        questions.add(Map.of(
                "category", "Data & Performance",
                "question", "Describe how you handle query optimization and transactional consistency in PostgreSQL or relational databases under high load.",
                "expectedCriteria", "Discusses indexes, query execution plans (EXPLAIN ANALYZE), connection pooling, and ACID transaction isolation levels."
        ));

        questions.add(Map.of(
                "category", "System Reliability & Security",
                "question", "How do you enforce stateless authentication and authorization using JWT and Spring Security in distributed environments?",
                "expectedCriteria", "Explains token signing, expiration strategies, role-based access control filters, and CSRF/CORS considerations."
        ));

        questions.add(Map.of(
                "category", "Problem Solving",
                "question", "Walk through a challenging bug or production issue you investigated and how you resolved it systematically.",
                "expectedCriteria", "Follows structured debugging methodology: reproduction, telemetry/log analysis, root cause isolation, regression testing."
        ));

        questions.add(Map.of(
                "category", "Behavioral & Leadership",
                "question", "Tell me about a situation where product requirements changed midway through a sprint. How did you adapt your implementation?",
                "expectedCriteria", "Demonstrates agility, constructive team communication, pragmatic trade-offs, and commitment to delivery."
        ));

        return questions;
    }

    // --- Helper Methods ---

    private List<String> extractSkillsFromText(String text) {
        if (text == null) return Collections.emptyList();
        String lower = text.toLowerCase();
        List<String> found = new ArrayList<>();
        for (String skill : KNOWN_SKILLS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skill.toLowerCase()) + "\\b");
            if (pattern.matcher(lower).find()) {
                found.add(skill);
            }
        }
        return found;
    }

    private List<String> extractSkillsFromJsonOrText(String input) {
        if (input == null || input.isBlank()) {
            return extractSkillsFromText("");
        }
        try {
            JsonNode node = objectMapper.readTree(input);
            if (node.has("skills") && node.get("skills").isArray()) {
                List<String> list = new ArrayList<>();
                node.get("skills").forEach(s -> list.add(s.asText()));
                if (!list.isEmpty()) return list;
            }
        } catch (Exception ignored) {}
        return extractSkillsFromText(input);
    }

    private String estimateExperience(String text) {
        Pattern pattern = Pattern.compile("(\\d+\\+?\\s*(?:years|yrs|year))", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "2+ years (estimated)";
    }

    private String estimateEducation(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("b.tech") || lower.contains("bachelor") || lower.contains("b.e.") || lower.contains("bs in")) {
            return "Bachelor's Degree in Computer Science / Engineering";
        }
        if (lower.contains("m.tech") || lower.contains("master") || lower.contains("ms in")) {
            return "Master's Degree in Computer Science";
        }
        return "University Degree in Technical Field";
    }

    private String createDefaultParsedData(String fileName, List<String> skills) {
        Map<String, Object> map = new HashMap<>();
        map.put("filename", fileName);
        map.put("skills", skills);
        map.put("summary", "Resume uploaded successfully.");
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{\"filename\":\"" + fileName + "\"}";
        }
    }

    private String truncate(String text, int maxChars) {
        if (text == null) return "";
        return text.length() <= maxChars ? text : text.substring(0, maxChars) + "...";
    }
}
