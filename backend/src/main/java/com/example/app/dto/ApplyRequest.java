package com.example.app.dto;

import jakarta.validation.constraints.NotBlank;

public class ApplyRequest {

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotBlank(message = "Company name is required")
    private String company;

    public ApplyRequest() {}

    public ApplyRequest(String jobTitle, String company) {
        this.jobTitle = jobTitle;
        this.company = company;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }
}
