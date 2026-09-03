package com.example.app.repository;

import com.example.app.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByUserEmail(String email);
    Optional<Candidate> findByUserId(Long userId);
}
