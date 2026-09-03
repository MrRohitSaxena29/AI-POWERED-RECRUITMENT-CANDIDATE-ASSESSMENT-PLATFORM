package com.example.app.repository;

import com.example.app.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByCandidateIdOrderByUploadedAtDesc(Long candidateId);
    List<Resume> findByCandidateUserEmailOrderByUploadedAtDesc(String email);
}
