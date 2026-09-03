package com.example.app.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(nullable = false)
    private String status; // Applied, Screening, Shortlisted, Interview Scheduled, Accepted, Rejected

    private LocalDateTime appliedAt;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Assessment assessment;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Interview interview;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private AIReport aiReport;

    @PrePersist
    protected void onCreate() {
        if (this.appliedAt == null) {
            this.appliedAt = LocalDateTime.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "Applied";
        }
    }

    public Application() {}

    public Application(Candidate candidate, Job job, String status) {
        this.candidate = candidate;
        this.job = job;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }

    public Job getJob() {
        return job;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }

    public Interview getInterview() {
        return interview;
    }

    public void setInterview(Interview interview) {
        this.interview = interview;
    }

    public String getJobTitle() {
        return job != null ? job.getTitle() : null;
    }

    public String getCompany() {
        return (job != null && job.getCompany() != null) ? job.getCompany().getName() : null;
    }

    public AIReport getAiReport() {
        return aiReport;
    }

    public void setAiReport(AIReport aiReport) {
        this.aiReport = aiReport;
    }
}
